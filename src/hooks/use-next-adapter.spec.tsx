import type { ReactElement } from 'react';

import { act, render, renderHook, screen } from '@testing-library/react';
import { StrictMode } from 'react';

import { articleList } from '../../test/fixtures/article-list';
import { NextAdapter } from '../components/next-adapter';
import { useNextAdapter } from './use-next-adapter';
import { useQubeeList } from './use-qubee-list';

// The App Router's hooks need Next's own runtime, which a unit test does not have. These fakes
// stand in for it; the fixture app in fixtures/next-app runs the adapter against the real thing.
const next = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();

  return {
    pathname: '/articles',
    push,
    replace,
    // The App Router hands out one router object for the life of the app.
    router: { push, replace },
    search: new URLSearchParams('page=3'),
  };
});

vi.mock('next/navigation.js', () => ({
  usePathname: (): string => next.pathname,
  useRouter: (): typeof next.router => next.router,
  useSearchParams: (): URLSearchParams => next.search,
}));

function NextPage(): ReactElement {
  const list = useQubeeList(articleList);

  return (
    <button onClick={() => list.setPage(list.state.page + 1)} type="button">
      page {list.state.page}
    </button>
  );
}

describe('useNextAdapter', () => {
  beforeEach(() => {
    next.pathname = '/articles';
    next.search = new URLSearchParams('page=3');
    next.push.mockReset();
    next.replace.mockReset();
  });

  describe('location', () => {
    it('should report the pathname and the search params of the App Router', () => {
      const { result } = renderHook(() => useNextAdapter(), { wrapper: StrictMode });

      expect(result.current.pathname).toBe('/articles');
      expect(result.current.search).toBe(next.search);
    });

    it('should keep the same adapter while the location is unchanged', () => {
      const { rerender, result } = renderHook(() => useNextAdapter());
      const adapter = result.current;

      rerender();

      expect(result.current).toBe(adapter);
    });
  });

  describe('navigate', () => {
    it('should push without scrolling to the top', () => {
      const { result } = renderHook(() => useNextAdapter());

      act(() => result.current.navigate('/articles?page=4', { replace: false }));

      expect(next.push).toHaveBeenCalledExactlyOnceWith('/articles?page=4', { scroll: false });
      expect(next.replace).not.toHaveBeenCalled();
    });

    it('should replace when asked to', () => {
      const { result } = renderHook(() => useNextAdapter());

      act(() => result.current.navigate('/articles?q=react', { replace: true }));

      expect(next.replace).toHaveBeenCalledExactlyOnceWith('/articles?q=react', { scroll: false });
      expect(next.push).not.toHaveBeenCalled();
    });

    it('should scroll to the top when the option says so', () => {
      const { result } = renderHook(() => useNextAdapter({ scroll: true }));

      act(() => result.current.navigate('/articles?page=4', { replace: false }));
      act(() => result.current.navigate('/articles?page=4', { replace: true }));

      expect(next.push).toHaveBeenCalledWith('/articles?page=4', { scroll: true });
      expect(next.replace).toHaveBeenCalledWith('/articles?page=4', { scroll: true });
    });
  });

  describe('NextAdapter', () => {
    it('should give the lists below it the App Router', () => {
      render(
        <StrictMode>
          <NextAdapter>
            <NextPage />
          </NextAdapter>
        </StrictMode>
      );

      act(() => screen.getByRole('button', { name: 'page 3' }).click());

      expect(next.push).toHaveBeenCalledExactlyOnceWith('/articles?page=4', { scroll: false });
    });

    it('should pass its scroll prop to every navigation', () => {
      render(
        <NextAdapter scroll>
          <NextPage />
        </NextAdapter>
      );

      act(() => screen.getByRole('button', { name: 'page 3' }).click());

      expect(next.push).toHaveBeenCalledExactlyOnceWith('/articles?page=4', { scroll: true });
    });

    it('should read its scroll prop on the first render only', () => {
      const { rerender } = render(
        <NextAdapter scroll>
          <NextPage />
        </NextAdapter>
      );

      rerender(
        <NextAdapter scroll={false}>
          <NextPage />
        </NextAdapter>
      );

      act(() => screen.getByRole('button', { name: 'page 3' }).click());

      expect(next.push).toHaveBeenCalledExactlyOnceWith('/articles?page=4', { scroll: true });
    });
  });
});
