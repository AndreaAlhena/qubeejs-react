import type { Sort } from '@qubeejs/core';
import type { RenderHookResult } from '@testing-library/react';
import type { ReactElement } from 'react';

import { SortEnum } from '@qubeejs/core';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import type { TestRouter } from '../../test/helpers/test-router.type';
import type { ListStateHandle } from '../types/list-state-handle.type';

import { articleList } from '../../test/fixtures/article-list';
import { ArticleStatusEnum } from '../../test/fixtures/article-status.enum';
import { createTestRouter } from '../../test/helpers/create-test-router';
import { uriFor } from '../../test/helpers/uri-for';
import { useListState } from './use-list-state';

type ArticleListHandle = ListStateHandle<typeof articleList>;

function renderList(router: TestRouter): RenderHookResult<ArticleListHandle, unknown> {
  return renderHook(() => useListState(articleList, router.useRouter()), { wrapper: StrictMode });
}

describe('useListState', () => {
  describe('state', () => {
    it('should read the list state from the router URL', () => {
      const { result } = renderList(createTestRouter('/articles?page=2&q=react'));

      expect(result.current.state.page).toBe(2);
      expect(result.current.state.q).toBe('react');
      expect(result.current.state.status).toBeUndefined();
      expect(result.current.state.sort).toEqual([{ field: 'publishedAt', order: SortEnum.DESC }]);
    });

    it('should accept a record as the search', () => {
      const { result } = renderHook(
        () =>
          useListState(articleList, {
            navigate: vi.fn(),
            pathname: '/articles',
            search: { q: 'react', status: ['draft'] },
          }),
        { wrapper: StrictMode }
      );

      expect(result.current.state.q).toBe('react');
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
    });

    it('should type the state from the definition', () => {
      const { result } = renderList(createTestRouter('/articles'));

      expectTypeOf(result.current.state.page).toEqualTypeOf<number>();
      expectTypeOf(result.current.state.q).toEqualTypeOf<string | undefined>();
      expectTypeOf(result.current.state.status).toEqualTypeOf<ArticleStatusEnum | undefined>();
      expectTypeOf(result.current.state.sort).toEqualTypeOf<readonly Sort[]>();
    });
  });

  describe('set', () => {
    it('should navigate once, with the href it built', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
      });

      expect(router.navigations).toEqual([
        { href: '/articles?q=react', options: { replace: false } },
      ]);
      expect(result.current.state.q).toBe('react');
      expect(result.current.isPending).toBe(false);
    });

    it('should forward replace', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' }, { replace: true });
      });

      expect(router.navigations[0].options).toEqual({ replace: true });
    });

    it('should return to page 1 when anything else changes', () => {
      const router = createTestRouter('/articles?page=3');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ status: ArticleStatusEnum.PUBLISHED });
      });

      expect(router.navigations[0].href).toBe('/articles?status=published');
    });

    it('should chain two calls made in the same event', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
        result.current.set({ status: ArticleStatusEnum.DRAFT });
      });

      expect(router.navigations.map(({ href }) => href)).toEqual([
        '/articles?q=react',
        '/articles?q=react&status=draft',
      ]);
      expect(result.current.state.q).toBe('react');
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
    });

    it('should show the new state before the URL catches up', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
      });

      expect(result.current.state.q).toBe('react');
      expect(result.current.isPending).toBe(true);

      act(() => {
        router.settle();
      });

      expect(result.current.state.q).toBe('react');
      expect(result.current.isPending).toBe(false);
    });

    it('should keep the latest state across intermediate URLs', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'a' });
      });
      act(() => {
        result.current.set({ q: 'ab' });
      });
      act(() => {
        router.settle();
      });

      expect(result.current.state.q).toBe('ab');
      expect(result.current.isPending).toBe(true);

      act(() => {
        router.settle();
      });

      expect(result.current.isPending).toBe(false);
    });

    it('should not navigate to the URL it is already on', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: undefined });
      });

      expect(router.navigations).toEqual([]);
      expect(result.current.isPending).toBe(false);
    });

    it('should not navigate to the URL it is already on, even with a comma in the query', () => {
      const router = createTestRouter('/articles?sort=-publishedAt,title');
      const { result } = renderList(router);

      act(() => {
        result.current.set({
          sort: [
            { field: 'publishedAt', order: SortEnum.DESC },
            { field: 'title', order: SortEnum.ASC },
          ],
        });
      });

      expect(router.navigations).toEqual([]);
      expect(result.current.isPending).toBe(false);
    });

    it('should settle after its own navigation to a query with a comma', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({
          sort: [
            { field: 'publishedAt', order: SortEnum.DESC },
            { field: 'title', order: SortEnum.ASC },
          ],
          status: ArticleStatusEnum.DRAFT,
        });
      });
      act(() => {
        result.current.set({ q: 'react' });
      });
      act(() => {
        router.settle();
      });

      expect(result.current.state.q).toBe('react');
      expect(result.current.isPending).toBe(true);

      act(() => {
        router.settle();
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
    });

    it('should supersede in-flight navigations when returning to the current URL', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'a' });
      });
      act(() => {
        result.current.set({ q: undefined });
      });

      expect(router.navigations.map(({ href }) => href)).toEqual(['/articles?q=a', '/articles']);
      expect(result.current.state.q).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });

    it('should settle when the router reorders the query', () => {
      const router = createTestRouter('/articles', {
        mode: 'manual',
        rewrite: () => '/articles?status=draft&q=react',
      });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react', status: ArticleStatusEnum.DRAFT });
      });
      act(() => {
        router.settle();
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.state.q).toBe('react');
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
    });

    it('should not flip back when the router reorders the query as navigations land', () => {
      const router = createTestRouter('/articles', {
        mode: 'manual',
        rewrite: (href) => {
          const [pathname, search] = href.split('?');

          return `${pathname}?${search.split('&').reverse().join('&')}`;
        },
      });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
      });
      act(() => {
        result.current.setPage(2);
      });
      act(() => {
        result.current.set({ status: ArticleStatusEnum.DRAFT });
      });
      act(() => {
        router.settle();
      });
      act(() => {
        router.settle();
      });

      expect(result.current.state.page).toBe(1);
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
      expect(result.current.isPending).toBe(true);

      act(() => {
        router.settle();
      });

      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
      expect(result.current.isPending).toBe(false);
    });

    it('should not push a duplicate entry for the URL the router reordered', () => {
      const router = createTestRouter('/articles?q=react&page=3');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ page: 3 });
      });

      expect(router.navigations).toEqual([]);
    });

    it('should not navigate to a value the list cannot read back', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.setPage(0);
      });

      expect(router.navigations).toEqual([]);
      expect(result.current.isPending).toBe(false);
    });

    it('should let a URL change it did not cause win', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
      });
      act(() => {
        router.external('/articles?status=draft');
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.state.q).toBeUndefined();
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
    });

    it('should type its changes from the definition', () => {
      const { result } = renderList(createTestRouter('/articles'));
      const { set } = result.current;

      expectTypeOf(set).toBeCallableWith({ q: 'react' });
      expectTypeOf(set).toBeCallableWith({ status: ArticleStatusEnum.DRAFT }, { replace: true });
      // @ts-expect-error nope is not a param of the list
      expectTypeOf(set).toBeCallableWith({ nope: 1 });
      // @ts-expect-error q is a string
      expectTypeOf(set).toBeCallableWith({ q: 1 });
    });
  });

  describe('setPage', () => {
    it('should navigate to the page, keeping the rest', () => {
      const router = createTestRouter('/articles?q=react');
      const { result } = renderList(router);

      act(() => {
        result.current.setPage(3);
      });

      expect(router.navigations[0].href).toBe('/articles?page=3&q=react');
      expect(result.current.state.page).toBe(3);
    });
  });

  describe('href', () => {
    it('should build hrefs from the draft', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' });
      });

      expect(result.current.href({ page: 2 })).toBe('/articles?page=2&q=react');
    });

    it('should type its changes from the definition', () => {
      const { result } = renderList(createTestRouter('/articles'));

      // @ts-expect-error nope is not a param of the list
      expect(() => result.current.href({ nope: 1 })).not.toThrow();
    });

    it('should keep parameters the list does not own', () => {
      const { result } = renderList(createTestRouter('/articles?panel=new'));

      expect(result.current.href({ page: 2 })).toBe('/articles?panel=new&page=2');
    });
  });

  describe('request', () => {
    it('should build the request from the committed state', () => {
      const router = createTestRouter('/articles', { mode: 'manual' });
      const { result } = renderList(router);

      expect(result.current.request.uri).toBe(uriFor(''));

      act(() => {
        result.current.set({ q: 'react' });
      });

      expect(result.current.request.uri).toBe(uriFor('q=react'));
    });

    it('should keep the same request while the committed state is unchanged', () => {
      const { rerender, result } = renderList(createTestRouter('/articles'));
      const request = result.current.request;

      rerender();

      expect(result.current.request).toBe(request);
    });
  });

  describe('server rendering', () => {
    it('should render the state from the router URL', () => {
      function Probe(): ReactElement {
        const list = useListState(articleList, {
          navigate: () => undefined,
          pathname: '/articles',
          search: 'q=react',
        });

        return <output>{list.state.q}</output>;
      }

      expect(
        renderToString(
          <StrictMode>
            <Probe />
          </StrictMode>
        )
      ).toBe('<output>react</output>');
    });
  });
});
