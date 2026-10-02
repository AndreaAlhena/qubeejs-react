import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { articleList } from '../../test/fixtures/article-list';
import { ArticleStatusEnum } from '../../test/fixtures/article-status.enum';
import { uriFor } from '../../test/helpers/uri-for';
import { useMemoryAdapter } from './use-memory-adapter';
import { useQubeeList } from './use-qubee-list';

describe('useMemoryAdapter', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/somewhere?page=9');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('location', () => {
    it('should start with an empty query and no pathname', () => {
      const { result } = renderHook(() => useMemoryAdapter(), { wrapper: StrictMode });

      expect(result.current.pathname).toBe('');
      expect(result.current.search).toBe('');
    });

    it('should start from the initial search, however it is spelled', () => {
      expect(renderHook(() => useMemoryAdapter('?page=2&q=react')).result.current.search).toBe(
        'page=2&q=react'
      );
      expect(renderHook(() => useMemoryAdapter({ page: '2' })).result.current.search).toBe(
        'page=2'
      );
      expect(
        renderHook(() => useMemoryAdapter(new URLSearchParams('q=react'))).result.current.search
      ).toBe('q=react');
    });

    it('should read the initial search on the first render only', () => {
      const { rerender, result } = renderHook(
        ({ search }: { search: string }) => useMemoryAdapter(search),
        { initialProps: { search: 'page=2' } }
      );

      rerender({ search: 'page=7' });

      expect(result.current.search).toBe('page=2');
    });

    it('should keep the same adapter while the query is unchanged', () => {
      const { rerender, result } = renderHook(() => useMemoryAdapter(), { wrapper: StrictMode });
      const adapter = result.current;

      rerender();

      expect(result.current).toBe(adapter);
    });

    it('should follow its own navigations, whatever replace says', () => {
      const { result } = renderHook(() => useMemoryAdapter(), { wrapper: StrictMode });

      act(() => result.current.navigate('?page=3', { replace: false }));

      expect(result.current.search).toBe('page=3');

      act(() => result.current.navigate('', { replace: true }));

      expect(result.current.search).toBe('');
    });
  });

  describe('with useQubeeList', () => {
    it('should drive a list without touching the page URL', () => {
      const { result } = renderHook(() => useQubeeList(articleList, useMemoryAdapter()), {
        wrapper: StrictMode,
      });

      act(() => result.current.set({ q: 'react', status: ArticleStatusEnum.DRAFT }));
      act(() => result.current.setPage(2));

      expect(result.current.state.q).toBe('react');
      expect(result.current.state.status).toBe(ArticleStatusEnum.DRAFT);
      expect(result.current.state.page).toBe(2);
      expect(result.current.isPending).toBe(false);
      expect(result.current.request.uri).toBe(uriFor('page=2&q=react&status=draft'));
      expect(window.location.search).toBe('?page=9');
    });

    it('should build hrefs that hold only the query', () => {
      const { result } = renderHook(() => useQubeeList(articleList, useMemoryAdapter('q=react')));

      expect(result.current.href({ page: 2 })).toBe('?page=2&q=react');
      expect(result.current.href({ q: undefined })).toBe('');
    });

    it('should debounce, with the state ahead of the request', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useQubeeList(articleList, useMemoryAdapter()), {
        wrapper: StrictMode,
      });
      const before = result.current.request.uri;

      act(() => result.current.set({ q: 'react' }, { debounce: 300 }));

      expect(result.current.state.q).toBe('react');
      expect(result.current.isPending).toBe(true);
      expect(result.current.request.uri).toBe(before);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.request.uri).toBe(uriFor('q=react'));
    });

    it('should reset to the list defaults, not to the initial search', () => {
      const { result } = renderHook(() =>
        useQubeeList(articleList, useMemoryAdapter('page=3&q=react'))
      );

      act(() => result.current.reset());

      expect(result.current.state.page).toBe(1);
      expect(result.current.state.q).toBeUndefined();
    });

    it('should keep two components apart', () => {
      const first = renderHook(() => useQubeeList(articleList, useMemoryAdapter()));
      const second = renderHook(() => useQubeeList(articleList, useMemoryAdapter()));

      act(() => first.result.current.setPage(4));

      expect(first.result.current.state.page).toBe(4);
      expect(second.result.current.state.page).toBe(1);
    });
  });

  describe('server rendering', () => {
    it('should render the initial search', () => {
      function Probe(): string {
        return useMemoryAdapter('page=2').search as string;
      }

      expect(renderToString(<Probe />)).toBe('page=2');
    });
  });
});
