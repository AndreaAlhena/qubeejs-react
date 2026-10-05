import type {
  ListDefinition,
  ListInput,
  ListParams,
  ListRequest,
  QueryBuilder,
  Sort,
} from '@qubeejs/core';
import type { RenderHookResult } from '@testing-library/react';
import type { ComponentType, ReactElement, ReactNode } from 'react';

import {
  buildListRequest,
  defineList,
  integerParam,
  readListState,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
} from '@qubeejs/core';
import { act, render, renderHook } from '@testing-library/react';
import * as React from 'react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import type { TestRouter } from '../../test/helpers/test-router.type';
import type { LooseList } from '../types/loose-list.type';
import type { QubeeFetcher } from '../types/qubee-fetcher.type';
import type { QubeeListArgs } from '../types/qubee-list-args.type';
import type { QubeeListHandle } from '../types/qubee-list-handle.type';
import type { QubeeListRequest } from '../types/qubee-list-request.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { articleList } from '../../test/fixtures/article-list';
import { ArticleStatusEnum } from '../../test/fixtures/article-status.enum';
import { tagList } from '../../test/fixtures/tag-list';
import { taskList } from '../../test/fixtures/task-list';
import { createTestRouter } from '../../test/helpers/create-test-router';
import { uriFor } from '../../test/helpers/uri-for';
import { MemoryAdapter } from '../components/memory-adapter';
import { useQubeeList } from './use-qubee-list';
import { useQubeeQuery } from './use-qubee-query';

/**
 * React 19.2's `Activity`; `undefined` on React 18, whose typings do not declare it.
 */
const Activity = (
  React as unknown as {
    Activity?: ComponentType<{ children: ReactNode; mode: 'hidden' | 'visible' }>;
  }
).Activity;

type ArticleListHandle = QubeeListHandle<typeof articleList>;

function renderList(router: TestRouter): RenderHookResult<ArticleListHandle, unknown> {
  return renderHook(() => useQubeeList(articleList, router.useRouter()), { wrapper: StrictMode });
}

type TaskListHandle = QubeeListHandle<typeof taskList>;

type TaskProps = { input: ListInput<typeof taskList> | null };

function renderTasks(
  router: TestRouter,
  input: TaskProps['input']
): RenderHookResult<TaskListHandle, TaskProps> {
  return renderHook(({ input: current }) => useQubeeList(taskList, current, router.useRouter()), {
    initialProps: { input },
    wrapper: StrictMode,
  });
}

const taskUriFor = (search: string, projectId: string): string =>
  buildListRequest(taskList, readListState(taskList, search), { projectId }).uri;

/** A list written by hand, without `defineList`, as `@qubeejs/core` 1.3 allowed: no input. */
const noteList = {
  apply: (builder: QueryBuilder): void => {
    builder.setLimit(10);
  },
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'notes',
};

/** A list written by hand whose `apply` requires its input, as `@qubeejs/core` 1.4.1 reads it. */
const handTaskList = {
  apply: (builder: QueryBuilder, _state: unknown, { projectId }: { projectId: string }): void => {
    builder.addFilter('project', projectId);
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    sort: sortParam('sort', { fields: ['title'] as const }),
  },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'tasks',
};

/** Generic code that forwards the arguments, as the JSDoc of `QubeeListArgs` shows. */
function useTaskTable<T extends ListDefinition<ListParams>>(
  list: T,
  ...args: QubeeListArgs<T>
): QubeeListHandle<T> {
  return useQubeeList(list, ...args);
}

/** Generic code that reads the request without knowing the list. */
function requestOf<T extends ListDefinition<ListParams>>(
  handle: QubeeListHandle<T>
): ListRequest | null {
  return handle.request;
}

describe('useQubeeList', () => {
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
          useQubeeList(articleList, {
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

  describe('reset', () => {
    it('should return every param to its default in one navigation', () => {
      const router = createTestRouter('/articles?page=3&q=react&sort=title&status=draft');
      const { result } = renderList(router);

      act(() => result.current.reset());

      expect(router.navigations).toEqual([{ href: '/articles', options: { replace: false } }]);
      expect(result.current.state.page).toBe(1);
      expect(result.current.state.q).toBeUndefined();
      expect(result.current.state.status).toBeUndefined();
      expect(result.current.state.sort).toEqual([{ field: 'publishedAt', order: SortEnum.DESC }]);
    });

    it('should keep parameters the list does not own', () => {
      const router = createTestRouter('/articles?q=react&utm=newsletter');
      const { result } = renderList(router);

      act(() => result.current.reset());

      expect(router.navigations.map((navigation) => navigation.href)).toEqual([
        '/articles?utm=newsletter',
      ]);
    });

    it('should forward replace', () => {
      const router = createTestRouter('/articles?q=react');
      const { result } = renderList(router);

      act(() => result.current.reset({ replace: true }));

      expect(router.navigations[0].options).toEqual({ replace: true });
    });

    it('should not navigate when the list is already at its defaults', () => {
      const router = createTestRouter('/articles?utm=newsletter');
      const { result } = renderList(router);

      act(() => result.current.reset());

      expect(router.navigations).toEqual([]);
    });

    it('should cancel a pending debounce', () => {
      vi.useFakeTimers();

      const router = createTestRouter('/articles?q=react');
      const { result } = renderList(router);

      act(() => result.current.set({ q: 'reactive' }, { debounce: 300 }));
      act(() => result.current.reset());
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations.map((navigation) => navigation.href)).toEqual(['/articles']);
      expect(result.current.state.q).toBeUndefined();
      expect(result.current.isPending).toBe(false);

      vi.useRealTimers();
    });

    it('should take no debounce', () => {
      const { result } = renderList(createTestRouter('/articles'));

      // @ts-expect-error — reset() navigates at once: it has no debounce option
      result.current.reset({ debounce: 300 });

      expect(result.current.state.page).toBe(1);
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

  describe('input', () => {
    const adapter: RouterAdapter = { navigate: () => undefined, pathname: '/tasks', search: '' };

    it('should put the input in the request', () => {
      const { result } = renderTasks(createTestRouter('/projects/42/tasks?status=open'), {
        projectId: '42',
      });

      expect(result.current.request?.uri).toBe(taskUriFor('status=open', '42'));
      expect(result.current.state).toMatchObject({ page: 1, status: 'open' });
    });

    it("should take the provider's adapter when the input is the only argument", () => {
      const { result } = renderHook(() => useQubeeList(taskList, { projectId: '42' }), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StrictMode>
            <MemoryAdapter initialSearch="status=done">{children}</MemoryAdapter>
          </StrictMode>
        ),
      });

      expect(result.current.request?.uri).toBe(taskUriFor('status=done', '42'));
    });

    it('should take a bare value as the input', () => {
      const projectTaskList = defineList({
        apply: (builder, _state, projectId: string) => {
          builder.addFilter('project', projectId);
        },
        params: { page: integerParam('page', { default: 1, min: 1 }) },
        qubee: { driver: STRAPI_DRIVER },
        resource: 'tasks',
      });
      const router = createTestRouter('/projects/42/tasks');
      const { result } = renderHook(() => useQubeeList(projectTaskList, '42', router.useRouter()), {
        wrapper: StrictMode,
      });

      expect(result.current.request?.uri).toBe(
        buildListRequest(projectTaskList, readListState(projectTaskList, ''), '42').uri
      );
    });

    it('should have no request while the input is null', () => {
      const { result } = renderTasks(createTestRouter('/projects/42/tasks'), null);

      expect(result.current.request).toBeNull();
    });

    it('should fetch nothing while the input is null', () => {
      const fetcher = vi.fn<QubeeFetcher>();
      const router = createTestRouter('/projects/42/tasks');
      const { result } = renderHook(
        () => {
          const tasks = useQubeeList(taskList, null, router.useRouter());

          return useQubeeQuery(tasks.request, { fetcher });
        },
        { wrapper: StrictMode }
      );

      expect(result.current).toMatchObject({ data: undefined, isFetching: false });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should build the request once the input is ready', () => {
      const { rerender, result } = renderTasks(createTestRouter('/projects/42/tasks'), null);

      rerender({ input: { projectId: '42' } });

      expect(result.current.request?.uri).toBe(taskUriFor('', '42'));
    });

    it('should build a new request when the input changes', () => {
      const { rerender, result } = renderTasks(createTestRouter('/projects/42/tasks'), {
        projectId: '42',
      });
      const request = result.current.request;

      rerender({ input: { projectId: '43' } });

      expect(result.current.request).not.toBe(request);
      expect(result.current.request?.uri).toBe(taskUriFor('', '43'));
    });

    it('should keep the request and the handle while an equal input is passed again', () => {
      const { rerender, result } = renderTasks(createTestRouter('/projects/42/tasks'), {
        projectId: '42',
      });
      const handle = result.current;

      rerender({ input: { projectId: '42' } });

      expect(result.current.request).toBe(handle.request);
      expect(result.current).toBe(handle);
    });

    it('should keep the request while an input holding an array is built again', () => {
      const labelList = defineList({
        apply: (builder, _state, { labels }: { labels: string[] }) => {
          builder.addFilter('labels', labels.join(','));
        },
        params: { page: integerParam('page', { default: 1, min: 1 }) },
        qubee: { driver: STRAPI_DRIVER },
        resource: 'tasks',
      });
      const router = createTestRouter('/tasks');
      const { rerender, result } = renderHook(
        ({ labels }) => useQubeeList(labelList, { labels }, router.useRouter()),
        { initialProps: { labels: ['bug', 'docs'] }, wrapper: StrictMode }
      );
      const request = result.current.request;

      rerender({ labels: ['bug', 'docs'] });

      expect(result.current.request).toBe(request);
    });

    it('should neither navigate nor change the href when the input changes', () => {
      const router = createTestRouter('/projects/42/tasks?status=open');
      const { rerender, result } = renderTasks(router, { projectId: '42' });
      const href = result.current.href({ page: 2 });

      rerender({ input: { projectId: '43' } });

      expect(router.navigations).toEqual([]);
      expect(result.current.href({ page: 2 })).toBe(href);
      expect(href).not.toContain('43');
    });

    it('should not keep the request of another list that asks for the same page', () => {
      const router = createTestRouter('/projects/42/tasks');
      const { rerender, result } = renderHook(
        ({ list }) => useQubeeList(list, { projectId: '42' }, router.useRouter()),
        { initialProps: { list: taskList }, wrapper: StrictMode }
      );
      const request = result.current.request;

      rerender({ list: { ...taskList } });

      expect(result.current.request).not.toBe(request);
      expect(result.current.request?.uri).toBe(request?.uri);
    });

    it('should forward the input through generic code', () => {
      const router = createTestRouter('/projects/42/tasks');
      const { result } = renderHook(
        () => useTaskTable(taskList, { projectId: '42' }, router.useRouter()),
        { wrapper: StrictMode }
      );

      expect(requestOf(result.current)?.uri).toBe(taskUriFor('', '42'));
    });

    it('should drive a list written by hand, which declares no input', () => {
      const router = createTestRouter('/notes?page=2');
      const { result } = renderHook(() => useQubeeList(noteList, router.useRouter()), {
        wrapper: StrictMode,
      });

      expect(result.current.request.uri).toBe(
        buildListRequest(noteList, readListState(noteList, 'page=2')).uri
      );
    });

    it('should drive a list written by hand whose apply requires its input', () => {
      const router = createTestRouter('/tasks?sort=title');
      const { result } = renderHook(
        () => useQubeeList(handTaskList, { projectId: '9' }, router.useRouter()),
        { wrapper: StrictMode }
      );

      expect(result.current.request?.uri).toBe(
        buildListRequest(handTaskList, readListState(handTaskList, 'sort=title'), {
          projectId: '9',
        }).uri
      );
    });

    describe('types', () => {
      it('should require a declared input, and refuse one for a list without it', () => {
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, {
          projectId: '42',
        });
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(
          taskList,
          { projectId: '42' },
          adapter
        );
        // @ts-expect-error — taskList declares an input: pass it, or null while it is not ready
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList);
        // @ts-expect-error — an adapter is not the input
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, adapter);
        // @ts-expect-error — undefined is no input; null means "not ready yet"
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, undefined);
        // @ts-expect-error — projectId is a string
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, { projectId: 42 });
        expectTypeOf(useQubeeList<typeof articleList>).toBeCallableWith(articleList);
        expectTypeOf(useQubeeList<typeof articleList>).toBeCallableWith(articleList, adapter);
        expectTypeOf(useQubeeList<typeof articleList>).toBeCallableWith(
          articleList,
          // @ts-expect-error — articleList declares no input
          { projectId: '42' }
        );
      });

      it('should require an input whose fields are all optional, as {}', () => {
        const tenantList = defineList({
          apply: (builder, _state, { tenant }: { tenant?: string }) => {
            if (tenant) {
              builder.addFilter('tenant', tenant);
            }
          },
          params: { page: integerParam('page', { default: 1, min: 1 }) },
          qubee: { driver: STRAPI_DRIVER },
          resource: 'tasks',
        });

        expectTypeOf(useQubeeList<typeof tenantList>).toBeCallableWith(tenantList, {});
        // @ts-expect-error — the input is required even when every field of it is optional
        expectTypeOf(useQubeeList<typeof tenantList>).toBeCallableWith(tenantList);
      });

      it('should accept null for a list with an input', () => {
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, null);
        expectTypeOf(useQubeeList<typeof taskList>).toBeCallableWith(taskList, null, adapter);
      });

      it('should make the request nullable only for a list with an input', () => {
        expectTypeOf<TaskListHandle['request']>().toEqualTypeOf<ListRequest | null>();
        expectTypeOf<ArticleListHandle['request']>().toEqualTypeOf<ListRequest>();
      });

      it('should require the input of a list written by hand whose apply requires it', () => {
        expectTypeOf(useQubeeList<typeof handTaskList>).toBeCallableWith(handTaskList, {
          projectId: '9',
        });
        // @ts-expect-error — the apply of handTaskList requires its input
        expectTypeOf(useQubeeList<typeof handTaskList>).toBeCallableWith(handTaskList);
        expectTypeOf<QubeeListHandle<typeof handTaskList>['toggleSort']>()
          .parameter(0)
          .toEqualTypeOf<'title'>();
      });

      it('should need no input for a list written by hand, or held through an alias', () => {
        expectTypeOf(useQubeeList<typeof noteList>).toBeCallableWith(noteList);
        expectTypeOf<QubeeListRequest<typeof noteList>>().toEqualTypeOf<ListRequest>();
        expectTypeOf(useQubeeList<LooseList>).toBeCallableWith(articleList);
        expectTypeOf<QubeeListRequest<LooseList>>().toEqualTypeOf<ListRequest>();
      });

      it('should infer the handle of a list with an input', () => {
        expectTypeOf<TaskListHandle['state']['page']>().toEqualTypeOf<number>();
        expectTypeOf<TaskListHandle['state']['status']>().toEqualTypeOf<
          'done' | 'open' | undefined
        >();
        expectTypeOf<TaskListHandle['toggleSort']>().parameter(0).toEqualTypeOf<'due' | 'title'>();
      });

      it('should refuse an input type where a function fits at navigate', () => {
        type ArgsFor<TInput extends NonNullable<unknown>> = QubeeListArgs<
          ListDefinition<ListParams, TInput>
        >;
        type Refused = [input: never, adapter?: RouterAdapter];

        expectTypeOf<ArgsFor<{ navigate: () => void }>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<{ navigate?: () => void }>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<{ a: string } | { navigate: () => void }>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<Record<string, unknown>>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<{ navigate: string }>>().toEqualTypeOf<
          [input: { navigate: string } | null, adapter?: RouterAdapter]
        >();
        expectTypeOf<ArgsFor<Record<string, string>>>().toEqualTypeOf<
          [input: Record<string, string> | null, adapter?: RouterAdapter]
        >();
      });

      it('should refuse an input type that any object fits, as an adapter does', () => {
        type ArgsFor<TInput extends NonNullable<unknown>> = QubeeListArgs<
          ListDefinition<ListParams, TInput>
        >;
        type Refused = [input: never, adapter?: RouterAdapter];

        expectTypeOf<ArgsFor<object>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<NonNullable<unknown>>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<object | string>>().toEqualTypeOf<Refused>();
        expectTypeOf<ArgsFor<{ tenant?: string }>>().toEqualTypeOf<
          [input: { tenant?: string } | null, adapter?: RouterAdapter]
        >();
        expectTypeOf<ArgsFor<() => string>>().toEqualTypeOf<
          [input: (() => string) | null, adapter?: RouterAdapter]
        >();
      });

      it('should keep the callers of generic code that forwards the arguments checked', () => {
        expectTypeOf(useTaskTable<typeof taskList>).toBeCallableWith(taskList, {
          projectId: '42',
        });
        // @ts-expect-error — the wrapper requires the input too
        expectTypeOf(useTaskTable<typeof taskList>).toBeCallableWith(taskList);
      });

      it('should erase the input in generic code that does not forward the arguments', () => {
        // While T is unknown, the list reads as one without an input, as it does through
        // ListDefinition<ListParams>: the call compiles, and the callers go unchecked.
        function useAnyList<T extends ListDefinition<ListParams>>(list: T): QubeeListHandle<T> {
          return useQubeeList(list);
        }

        expectTypeOf(useAnyList<typeof taskList>).toBeCallableWith(taskList);
      });
    });
  });

  describe('server rendering', () => {
    it('should render the state from the router URL', () => {
      function Probe(): ReactElement {
        const list = useQubeeList(articleList, {
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

    it('should render the request of a list with an input, and none while it is null', () => {
      function Probe({ projectId }: { projectId: null | string }): ReactElement {
        const list = useQubeeList(taskList, projectId === null ? null : { projectId }, {
          navigate: () => undefined,
          pathname: '/projects/42/tasks',
          search: 'status=open',
        });

        return <output>{list.request?.uri ?? 'none'}</output>;
      }

      expect(
        renderToString(
          <StrictMode>
            <Probe projectId="42" />
          </StrictMode>
        )
      ).toBe(`<output>${taskUriFor('status=open', '42').replaceAll('&', '&amp;')}</output>`);
      expect(
        renderToString(
          <StrictMode>
            <Probe projectId={null} />
          </StrictMode>
        )
      ).toBe('<output>none</output>');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should collapse calls within the window into one navigation', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current.set({ q: 're' }, { debounce: 300 });
      });
      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(router.navigations).toEqual([]);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(router.navigations).toEqual([{ href: '/articles?q=re', options: { replace: false } }]);
    });

    it('should commit at once when the user clicks a link, before the link navigates', () => {
      const router = createTestRouter('/articles');
      const seen: string[] = [];

      function Page(): ReactElement {
        const adapter = router.useRouter();
        const list = useQubeeList(articleList, adapter);

        return (
          <>
            <button onClick={() => list.set({ q: 'react' }, { debounce: 300 })} type="button">
              type
            </button>
            <a
              href="/other"
              onClick={(event) => {
                event.preventDefault();
                seen.push(...router.navigations.map((navigation) => navigation.href));
                adapter.navigate('/other', { replace: false });
              }}
            >
              <span>leave</span>
            </a>
          </>
        );
      }

      const { getByRole, getByText } = render(<Page />, { wrapper: StrictMode });

      act(() => getByRole('button', { name: 'type' }).click());
      // The click lands on an element inside the link, as it does on a link with an icon.
      act(() => getByText('leave').click());
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // The search was already committed when the link's own handler ran, and nothing follows.
      expect(seen).toEqual(['/articles?q=react']);
      expect(router.navigations.map((navigation) => navigation.href)).toEqual([
        '/articles?q=react',
        '/other',
      ]);
    });

    it('should commit at once when the link is inside a shadow root', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);
      const host = document.createElement('div');
      const link = document.createElement('a');

      link.href = '/other';
      link.addEventListener('click', (event) => event.preventDefault());
      host.attachShadow({ mode: 'open' }).append(link);
      document.body.append(host);

      act(() => result.current.set({ q: 'react' }, { debounce: 300 }));
      // Outside the shadow root the click's target is the host, not the link.
      act(() => link.click());

      expect(router.navigations.map((navigation) => navigation.href)).toEqual([
        '/articles?q=react',
      ]);

      host.remove();
    });

    it('should commit the waiting change before a link that changes the same list, in two navigations', () => {
      const router = createTestRouter('/articles');

      function Page(): ReactElement {
        const list = useQubeeList(articleList, router.useRouter());

        return (
          <>
            <button onClick={() => list.set({ q: 'react' }, { debounce: 300 })} type="button">
              type
            </button>
            <a
              href={list.href({ page: 2 })}
              onClick={(event) => {
                event.preventDefault();
                list.setPage(2);
              }}
            >
              2
            </a>
          </>
        );
      }

      const { getByRole } = render(<Page />, { wrapper: StrictMode });

      act(() => getByRole('button', { name: 'type' }).click());
      act(() => getByRole('link', { name: '2' }).click());
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // A page link is a link: the search is committed first, then the page. They end where one
      // navigation would have.
      expect(router.navigations.map((navigation) => navigation.href)).toEqual([
        '/articles?q=react',
        '/articles?page=2&q=react',
      ]);
    });

    it('should leave a click that is not on a link to the debounce', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => result.current.set({ q: 'react' }, { debounce: 300 }));
      act(() => {
        document.body.click();
      });

      expect(router.navigations).toEqual([]);
      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations).toHaveLength(1);
    });

    it('should listen for clicks only while a debounce is waiting', () => {
      const add = vi.spyOn(document, 'addEventListener');
      const remove = vi.spyOn(document, 'removeEventListener');
      const { result } = renderList(createTestRouter('/articles'));
      const clicks = (spy: typeof add): number =>
        spy.mock.calls.filter(([type]) => type === 'click').length;

      expect(clicks(add)).toBe(0);

      act(() => result.current.set({ q: 'react' }, { debounce: 300 }));

      expect(clicks(add)).toBeGreaterThan(0);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(clicks(remove)).toBe(clicks(add));

      add.mockRestore();
      remove.mockRestore();
    });

    it('should update the state at once and report pending while waiting', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
      });

      expect(result.current.state.q).toBe('r');
      expect(result.current.isPending).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isPending).toBe(false);
    });

    it('should keep the request until the debounce commits', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);
      const before = result.current.request;

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
      });

      expect(result.current.request).toBe(before);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.request.uri).toBe(uriFor('q=r'));
    });

    it('should merge changes to different keys', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' }, { debounce: 300 });
        result.current.set({ status: ArticleStatusEnum.DRAFT }, { debounce: 300 });
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations.map(({ href }) => href)).toEqual([
        '/articles?q=react&status=draft',
      ]);
    });

    it('should commit at once when an immediate set() follows', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'react' }, { debounce: 300 });
      });
      act(() => {
        result.current.set({ status: ArticleStatusEnum.DRAFT });
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations.map(({ href }) => href)).toEqual([
        '/articles?q=react&status=draft',
      ]);
    });

    it('should use the replace option of the last call', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
        result.current.set({ q: 're' }, { debounce: 300, replace: true });
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations[0].options).toEqual({ replace: true });
    });

    it('should not navigate after unmounting', () => {
      const router = createTestRouter('/articles');
      const { result, unmount } = renderList(router);

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
      });
      unmount();
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations).toEqual([]);
    });

    it('should cancel when the user navigates elsewhere', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.set({ q: 'r' }, { debounce: 300 });
      });
      act(() => {
        router.external('/authors');
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(router.navigations).toEqual([]);
      expect(result.current.state.q).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });

    it.skipIf(!Activity)(
      'should drop a pending draft when its effects are torn down without an unmount',
      () => {
        const router = createTestRouter('/articles');
        let handle: ArticleListHandle | undefined;
        const Page = (): ReactElement => {
          handle = useQubeeList(articleList, router.useRouter());

          return <output>{handle.state.q ?? ''}</output>;
        };
        const tree = (mode: 'hidden' | 'visible'): ReactElement => (
          <StrictMode>
            {Activity && (
              <Activity mode={mode}>
                <Page />
              </Activity>
            )}
          </StrictMode>
        );
        const { rerender } = render(tree('visible'));

        act(() => {
          handle?.set({ q: 'react' }, { debounce: 300 });
        });
        rerender(tree('hidden'));
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        rerender(tree('visible'));
        act(() => {
          vi.advanceTimersByTime(1000);
        });

        expect(handle?.isPending).toBe(false);
        expect(handle?.state.q).toBeUndefined();
        expect(router.navigations).toEqual([]);
      }
    );
  });

  describe('toggleSort', () => {
    it('should sort by a new field, ascending', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.toggleSort('title');
      });

      expect(router.navigations[0].href).toBe('/articles?sort=title');
      expect(result.current.state.sort).toEqual([{ field: 'title', order: SortEnum.ASC }]);
    });

    it('should flip the direction of the field already sorted', () => {
      const router = createTestRouter('/articles?sort=title');
      const { result } = renderList(router);

      act(() => {
        result.current.toggleSort('title');
      });

      expect(router.navigations[0].href).toBe('/articles?sort=-title');
    });

    it('should keep the other sorts with multiple', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.toggleSort('title', { multiple: true });
      });

      expect(router.navigations[0].href).toBe('/articles?sort=-publishedAt,title');
    });

    it('should forward the set() options', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.toggleSort('title', { replace: true });
      });

      expect(router.navigations[0].options).toEqual({ replace: true });
    });

    it('should chain two toggles made in the same event', () => {
      const router = createTestRouter('/articles');
      const { result } = renderList(router);

      act(() => {
        result.current.toggleSort('title');
        result.current.toggleSort('title');
      });

      expect(router.navigations.at(-1)?.href).toBe('/articles?sort=-title');
      expect(result.current.state.sort).toEqual([{ field: 'title', order: SortEnum.DESC }]);
    });

    it('should type its field from the sortParam', () => {
      const { result } = renderList(createTestRouter('/articles'));

      expectTypeOf(result.current.toggleSort).parameter(0).toEqualTypeOf<'publishedAt' | 'title'>();
      expectTypeOf(result.current.toggleSort).toBeCallableWith('title');
      expectTypeOf(result.current.toggleSort).toBeCallableWith('publishedAt', { multiple: true });
      // @ts-expect-error body is not a sortable field
      expectTypeOf(result.current.toggleSort).toBeCallableWith('body');
    });

    it('should not exist on a list without a sortParam', () => {
      const { result } = renderHook(
        () => useQubeeList(tagList, createTestRouter('/tags').useRouter()),
        { wrapper: StrictMode }
      );

      expect('toggleSort' in result.current).toBe(false);
      expectTypeOf(result.current).not.toHaveProperty('toggleSort');
    });
  });
});
