import type { ReactElement, ReactNode } from 'react';

import { defineList, integerParam, STRAPI_DRIVER, stringParam } from '@qubeejs/core';
import { act, render, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';

import { articleList } from '../../test/fixtures/article-list';
import { tagList } from '../../test/fixtures/tag-list';
import { createTestRouter } from '../../test/helpers/create-test-router';
import { MissingRouterAdapterError } from '../errors/missing-router-adapter.error';
import { createAdapterProvider } from '../utils/create-adapter-provider';
import { useQubeeList } from './use-qubee-list';

const sharedQ = stringParam('q');

const authorList = defineList({
  params: { page: integerParam('authorPage', { default: 1, min: 1 }), q: sharedQ },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'authors',
});

const bookList = defineList({
  params: { page: integerParam('bookPage', { default: 1, min: 1 }), q: sharedQ },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'books',
});

function Articles(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output>articles {state.page}</output>;
}

function Tags(): ReactElement {
  const { state } = useQubeeList(tagList);

  return <output>tags {state.page}</output>;
}

function Authors(): ReactElement {
  const { state } = useQubeeList(authorList);

  return <output>authors {state.page}</output>;
}

function Books(): ReactElement {
  const { state } = useQubeeList(bookList);

  return <output>books {state.page}</output>;
}

describe('useRouterAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('resolution', () => {
    it('should take the adapter from the nearest provider', () => {
      const router = createTestRouter('/articles?page=2&q=react');
      const Provider = createAdapterProvider(router.useRouter);
      const { result } = renderHook(() => useQubeeList(articleList), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StrictMode>
            <Provider>{children}</Provider>
          </StrictMode>
        ),
      });

      expect(result.current.state.page).toBe(2);

      act(() => result.current.setPage(3));

      expect(router.navigations).toEqual([
        { href: '/articles?page=3&q=react', options: { replace: false } },
      ]);
      expect(result.current.state.page).toBe(3);
    });

    it('should use the nearest of two providers', () => {
      const outer = createTestRouter('/articles?page=2');
      const inner = createTestRouter('/articles?page=5');
      const Outer = createAdapterProvider(outer.useRouter);
      const Inner = createAdapterProvider(inner.useRouter);
      const { result } = renderHook(() => useQubeeList(articleList), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Outer>
            <Inner>{children}</Inner>
          </Outer>
        ),
      });

      expect(result.current.state.page).toBe(5);
    });

    it('should prefer the adapter passed as an argument', () => {
      const provided = createTestRouter('/articles?page=2');
      const passed = createTestRouter('/articles?page=7');
      const Provider = createAdapterProvider(provided.useRouter);
      const { result } = renderHook(() => useQubeeList(articleList, passed.useRouter()), {
        wrapper: Provider,
      });

      expect(result.current.state.page).toBe(7);

      act(() => result.current.setPage(8));

      expect(passed.navigations).toHaveLength(1);
      expect(provided.navigations).toHaveLength(0);
    });

    it('should follow an adapter argument that appears and disappears', () => {
      const provided = createTestRouter('/articles?page=2');
      const passed = createTestRouter('/articles?page=7');
      const Provider = createAdapterProvider(provided.useRouter);
      const { rerender, result } = renderHook(
        ({ override }: { override: boolean }) => {
          const adapter = passed.useRouter();

          return useQubeeList(articleList, override ? adapter : undefined);
        },
        { initialProps: { override: false }, wrapper: Provider }
      );

      expect(result.current.state.page).toBe(2);

      rerender({ override: true });

      expect(result.current.state.page).toBe(7);

      rerender({ override: false });

      expect(result.current.state.page).toBe(2);
    });

    it('should throw when there is neither an argument nor a provider', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => renderHook(() => useQubeeList(articleList))).toThrow(MissingRouterAdapterError);
    });
  });

  describe('url-name collisions', () => {
    it('should warn once when two lists under one provider own the same url name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/articles').useRouter);

      render(
        <StrictMode>
          <Provider>
            <Articles />
            <Tags />
          </Provider>
        </StrictMode>
      );

      const messages = warn.mock.calls.map(([message]) => String(message));

      expect(messages.filter((message) => message.includes('"page"'))).toHaveLength(1);
      expect(messages.filter((message) => message.includes('"q"'))).toHaveLength(1);
      expect(messages[0]).toContain('"articles"');
      expect(messages[0]).toContain('"tags"');
    });

    it('should not warn for one list mounted twice', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/articles').useRouter);

      render(
        <Provider>
          <Articles />
          <Articles />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should not warn when two lists share the param object', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/library').useRouter);

      render(
        <Provider>
          <Authors />
          <Books />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should not warn for lists under different providers', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const First = createAdapterProvider(createTestRouter('/articles').useRouter);
      const Second = createAdapterProvider(createTestRouter('/tags').useRouter);

      render(
        <>
          <First>
            <Articles />
          </First>
          <Second>
            <Tags />
          </Second>
        </>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should not warn when a list definition is replaced, as hot reload does', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/drafts').useRouter);
      const declare = (): typeof tagList =>
        defineList({
          params: { page: integerParam('page', { default: 1, min: 1 }), q: stringParam('q') },
          qubee: { driver: STRAPI_DRIVER },
          resource: 'drafts',
        });
      const before = declare();
      const after = declare();

      function Drafts({ list }: { list: typeof tagList }): ReactElement {
        const { state } = useQubeeList(list);

        return <output>drafts {state.page}</output>;
      }

      const { rerender } = render(
        <Provider>
          <Drafts list={before} />
          <Drafts list={before} />
        </Provider>
      );

      rerender(
        <Provider>
          <Drafts list={after} />
          <Drafts list={after} />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should stop counting a list once it unmounts', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/articles').useRouter);
      const { rerender } = render(
        <Provider>
          <Articles />
        </Provider>
      );

      rerender(
        <Provider>
          <Tags />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should not check a list that passes its adapter', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const router = createTestRouter('/articles');
      const Provider = createAdapterProvider(router.useRouter);

      function PassedTags(): ReactElement {
        const { state } = useQubeeList(tagList, router.useRouter());

        return <output>tags {state.page}</output>;
      }

      render(
        <Provider>
          <Articles />
          <PassedTags />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });

    it('should stay silent in a production build', () => {
      vi.stubEnv('NODE_ENV', 'production');

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const Provider = createAdapterProvider(createTestRouter('/articles').useRouter);

      render(
        <Provider>
          <Articles />
          <Tags />
        </Provider>
      );

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
