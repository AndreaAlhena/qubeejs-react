import type { ReactElement } from 'react';

import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createMemoryRouter,
  Link,
  MemoryRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from 'react-router';

import { articleList } from '../../test/fixtures/article-list';
import { ReactRouterAdapter } from '../components/react-router-adapter';
import { useQubeeList } from './use-qubee-list';
import { useReactRouterAdapter } from './use-react-router-adapter';

function Articles(): ReactElement {
  const list = useQubeeList(articleList);
  const { pathname, search } = useLocation();

  return (
    <>
      <input
        aria-label="Search"
        onChange={(event) => list.set({ q: event.target.value }, { debounce: 300, replace: true })}
        value={list.state.q ?? ''}
      />
      <button onClick={() => list.toggleSort('title')} type="button">
        Sort by title
      </button>
      <Link to={list.href({ page: list.state.page + 1 })}>Next page</Link>
      <Link to="/other">Elsewhere</Link>
      <output data-testid="page">{list.state.page}</output>
      <output data-testid="q">{list.state.q ?? ''}</output>
      <output data-testid="pending">{String(list.isPending)}</output>
      <output data-testid="url">{`${pathname}${search}`}</output>
    </>
  );
}

function Root(): ReactElement {
  return (
    <ReactRouterAdapter>
      <Outlet />
    </ReactRouterAdapter>
  );
}

function Other(): ReactElement {
  const { pathname } = useLocation();

  return <output data-testid="url">{pathname}</output>;
}

function start(initial: string): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        children: [
          { element: <Articles />, path: 'articles' },
          { element: <Other />, path: 'other' },
        ],
        element: <Root />,
        path: '/',
      },
    ],
    { initialEntries: [initial] }
  );

  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );

  return router;
}

const text = (id: string): string => screen.getByTestId(id).textContent;

/** Run `action`, then let React Router's navigation land. */
const settle = (action: () => void): Promise<void> =>
  act(async () => {
    action();
    await Promise.resolve();
  });

/** Type into the search box the way a browser does: set the value, then fire `input`. */
const type = (value: string): Promise<void> =>
  settle(() => {
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Search' });

    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

const click = (role: 'button' | 'link', name: string): Promise<void> =>
  settle(() => screen.getByRole(role, { name }).click());

describe('useReactRouterAdapter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('location', () => {
    it('should read the list state from the React Router location', () => {
      start('/articles?page=3&q=react');

      expect(text('page')).toBe('3');
      expect(text('q')).toBe('react');
      expect(text('pending')).toBe('false');
    });

    it('should build links that React Router follows', async () => {
      start('/articles?q=react&utm=keep');

      expect(screen.getByRole('link', { name: 'Next page' }).getAttribute('href')).toBe(
        '/articles?utm=keep&page=2&q=react'
      );

      await click('link', 'Next page');

      expect(text('page')).toBe('2');
      expect(text('url')).toBe('/articles?utm=keep&page=2&q=react');
    });
  });

  describe('navigate', () => {
    it('should navigate through React Router, once per call', async () => {
      const router = start('/articles?page=3');

      await click('button', 'Sort by title');

      expect(text('url')).toBe('/articles?sort=title');
      expect(text('pending')).toBe('false');
      expect(router.state.historyAction).toBe('PUSH');
    });

    it('should replace the history entry when asked to', async () => {
      vi.useFakeTimers();

      const router = start('/articles');

      await type('react');

      expect(text('q')).toBe('react');
      expect(text('pending')).toBe('true');
      expect(text('url')).toBe('/articles');

      await act(() => vi.advanceTimersByTimeAsync(300));

      expect(text('url')).toBe('/articles?q=react');
      expect(text('pending')).toBe('false');
      expect(router.state.historyAction).toBe('REPLACE');
    });

    it('should follow the back button', async () => {
      const router = start('/articles');

      await click('link', 'Next page');

      expect(text('page')).toBe('2');

      await act(() => router.navigate(-1));

      expect(text('page')).toBe('1');
      expect(text('pending')).toBe('false');
    });

    it('should not pull the user back when they leave during a debounce', async () => {
      vi.useFakeTimers();
      start('/articles');

      await type('gone');
      await click('link', 'Elsewhere');
      await act(() => vi.advanceTimersByTimeAsync(300));

      expect(text('url')).toBe('/other');
    });
  });

  describe('as an argument', () => {
    it('should drive a list without a provider', async () => {
      function Passed(): ReactElement {
        const list = useQubeeList(articleList, useReactRouterAdapter());

        return (
          <button onClick={() => list.setPage(list.state.page + 1)} type="button">
            page {list.state.page}
          </button>
        );
      }

      render(
        <MemoryRouter initialEntries={['/articles?page=4']}>
          <Passed />
        </MemoryRouter>
      );

      await click('button', 'page 4');

      expect(screen.getByRole('button').textContent).toBe('page 5');
    });

    it('should keep the same adapter while the location is unchanged', () => {
      const adapters: unknown[] = [];

      function Probe({ tick }: { tick: number }): ReactElement {
        adapters.push(useReactRouterAdapter());

        return <output>{tick}</output>;
      }

      const { rerender } = render(
        <MemoryRouter initialEntries={['/articles']}>
          <Probe tick={1} />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter initialEntries={['/articles']}>
          <Probe tick={2} />
        </MemoryRouter>
      );

      expect(adapters.at(-1)).toBe(adapters.at(0));
    });
  });

  describe('server rendering', () => {
    it('should render the state of the requested URL', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/articles?page=6']}>
          <ReactRouterAdapter>
            <Articles />
          </ReactRouterAdapter>
        </MemoryRouter>
      );

      expect(html).toContain('data-testid="page">6<');
    });
  });
});
