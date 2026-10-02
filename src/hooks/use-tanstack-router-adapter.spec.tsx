import type { RouterHistory } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import type { MockInstance } from 'vitest';

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';

import { articleList } from '../../test/fixtures/article-list';
import { TanStackRouterAdapter } from '../components/tanstack-router-adapter';
import { parseSearch, stringifySearch } from '../utils/plain-search';
import { useQubeeList } from './use-qubee-list';
import { useTanStackRouterAdapter } from './use-tanstack-router-adapter';

function Articles(): ReactElement {
  const list = useQubeeList(articleList);
  const href = useLocation({ select: (location) => location.href });

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
      <button onClick={() => list.setPage(list.state.page + 1)} type="button">
        Next page
      </button>
      <Link to="/other">Elsewhere</Link>
      <output data-testid="page">{list.state.page}</output>
      <output data-testid="q">{list.state.q ?? ''}</output>
      <output data-testid="pending">{String(list.isPending)}</output>
      <output data-testid="url">{href}</output>
    </>
  );
}

function Passed(): ReactElement {
  const list = useQubeeList(articleList, useTanStackRouterAdapter());

  return (
    <button onClick={() => list.setPage(list.state.page + 1)} type="button">
      passed page {list.state.page}
    </button>
  );
}

/** Every adapter the probe below was handed, in render order. */
const probed: unknown[] = [];

/** Renders again without the location changing, and records the adapter each time. */
function Probe(): ReactElement {
  const [tick, setTick] = useState(0);

  probed.push(useTanStackRouterAdapter());

  return (
    <button onClick={() => setTick(tick + 1)} type="button">
      tick {tick}
    </button>
  );
}

/** A list that passes its own adapter, with scrolling on. */
function Scrolling(): ReactElement {
  const list = useQubeeList(articleList, useTanStackRouterAdapter({ scroll: true }));

  return (
    <button onClick={() => list.toggleSort('title')} type="button">
      Sort by title
    </button>
  );
}

function Other(): ReactElement {
  const href = useLocation({ select: (location) => location.href });

  return <output data-testid="url">{href}</output>;
}

function Root(): ReactElement {
  return (
    <TanStackRouterAdapter>
      <Outlet />
    </TanStackRouterAdapter>
  );
}

/** A root whose lists scroll to the top when they navigate. */
function ScrollingRoot(): ReactElement {
  return (
    <TanStackRouterAdapter scroll>
      <Outlet />
    </TanStackRouterAdapter>
  );
}

/** A root whose `scroll` prop changes after the first render. */
function TogglingRoot(): ReactElement {
  const [scroll, setScroll] = useState(true);

  return (
    <TanStackRouterAdapter scroll={scroll}>
      <button onClick={() => setScroll(false)} type="button">
        Stop scrolling
      </button>
      <Outlet />
    </TanStackRouterAdapter>
  );
}

/**
 * Render the app at `initial` and hand back the history, to watch its entries and go back, and a
 * spy on the router's `navigate`, to see what the adapter asks of it.
 */
async function start(
  initial: string,
  basepath?: string,
  root: () => ReactElement = Root,
  serialisers: { parseSearch?: typeof parseSearch; stringifySearch?: typeof stringifySearch } = {}
): Promise<{ history: RouterHistory; navigate: MockInstance }> {
  const rootRoute = createRootRoute({ component: root });
  const history = createMemoryHistory({ initialEntries: [initial] });
  const router = createRouter({
    ...serialisers,
    basepath,
    history,
    routeTree: rootRoute.addChildren([
      createRoute({ component: Articles, getParentRoute: () => rootRoute, path: '/articles' }),
      createRoute({ component: Passed, getParentRoute: () => rootRoute, path: '/passed' }),
      createRoute({ component: Probe, getParentRoute: () => rootRoute, path: '/probe' }),
      createRoute({ component: Scrolling, getParentRoute: () => rootRoute, path: '/scrolling' }),
      createRoute({ component: Other, getParentRoute: () => rootRoute, path: '/other' }),
    ]),
  });

  await act(async () => {
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
    await router.load();
  });

  return { history, navigate: vi.spyOn(router, 'navigate') };
}

const text = (id: string): string => screen.getByTestId(id).textContent;

/** Run `action`, then let TanStack Router's navigation land. */
const settle = (action: () => void): Promise<void> =>
  act(async () => {
    action();
    await new Promise((resolve) => setTimeout(resolve, 0));
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

const wait = (ms: number): Promise<void> =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

describe('useTanStackRouterAdapter', () => {
  let scrollTo: MockInstance<typeof window.scrollTo>;

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    probed.length = 0;
    vi.restoreAllMocks();
  });

  describe('location', () => {
    it('should read the list state from the TanStack Router location', async () => {
      await start('/articles?page=3&q=react');

      expect(text('page')).toBe('3');
      expect(text('q')).toBe('react');
      expect(text('pending')).toBe('false');
    });
  });

  describe('navigate', () => {
    it('should navigate through TanStack Router, once per call', async () => {
      const { history } = await start('/articles?page=3');
      const push = vi.spyOn(history, 'push');
      const replace = vi.spyOn(history, 'replace');

      await click('button', 'Sort by title');

      expect(text('url')).toBe('/articles?sort=title');
      expect(text('pending')).toBe('false');
      expect(push).toHaveBeenCalledTimes(1);
      expect(replace).not.toHaveBeenCalled();
    });

    it('should replace the history entry when asked to', async () => {
      const { history } = await start('/articles');
      const push = vi.spyOn(history, 'push');
      const replace = vi.spyOn(history, 'replace');

      await type('react');

      expect(text('q')).toBe('react');
      expect(text('pending')).toBe('true');
      expect(text('url')).toBe('/articles');

      await wait(350);

      expect(text('url')).toBe('/articles?q=react');
      expect(text('pending')).toBe('false');
      expect(replace).toHaveBeenCalledTimes(1);
      expect(push).not.toHaveBeenCalled();
    });

    it('should follow the back button', async () => {
      const { history } = await start('/articles');

      await click('button', 'Next page');

      expect(text('page')).toBe('2');

      await settle(() => history.back());

      expect(text('page')).toBe('1');
      expect(text('pending')).toBe('false');
    });

    it('should not pull the user back when they leave during a debounce', async () => {
      await start('/articles');

      await type('gone');
      await click('link', 'Elsewhere');
      await wait(350);

      expect(text('url')).toBe('/other');
    });

    it('should keep the list under a basepath', async () => {
      const { history } = await start('/app/articles?page=2', '/app');

      expect(text('page')).toBe('2');

      await click('button', 'Next page');

      expect(text('page')).toBe('3');
      expect(history.location.href).toBe('/app/articles?page=3');
    });

    it('should settle on the spelling TanStack Router gives a value it re-types', async () => {
      // TanStack Router parses the query as JSON and writes it back, so `q=1.50` becomes `q=1.5`.
      // The URL wins: the list settles on what the router reports, and is not left pending.
      await start('/articles');

      await type('1.50');
      await wait(350);

      expect(text('url')).toBe('/articles?q=1.5');
      expect(text('q')).toBe('1.5');
      expect(text('pending')).toBe('false');
    });
  });

  describe('with the plain-text search serialisers', () => {
    it('should keep a space typed after a number', async () => {
      await start('/articles', undefined, Root, { parseSearch, stringifySearch });

      await type('10 ');
      await wait(350);

      expect(text('url')).toBe('/articles?q=10+');
      expect(text('q')).toBe('10 ');
      expect(text('pending')).toBe('false');
    });

    it('should keep quotes and digits as typed', async () => {
      await start('/articles', undefined, Root, { parseSearch, stringifySearch });

      await type('"react hooks" 1.50');
      await wait(350);

      expect(text('q')).toBe('"react hooks" 1.50');
      expect(text('pending')).toBe('false');
    });

    it('should still read the page the router was opened at', async () => {
      await start('/articles?page=3&q=react', undefined, Root, { parseSearch, stringifySearch });

      expect(text('page')).toBe('3');
      expect(text('q')).toBe('react');
    });
  });

  describe('scroll', () => {
    it('should keep the scroll position when a list navigates', async () => {
      await start('/articles');
      scrollTo.mockClear();

      await click('button', 'Sort by title');

      expect(text('url')).toBe('/articles?sort=title');
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('should keep the scroll position when a debounced search lands', async () => {
      await start('/articles');
      scrollTo.mockClear();

      await type('react');
      await wait(350);

      expect(text('url')).toBe('/articles?q=react');
      expect(scrollTo).not.toHaveBeenCalled();
    });

    // Whether TanStack Router then scrolls depends on its version and on the app's scroll
    // restoration, so these three pin what the adapter asks of it.
    it('should ask TanStack Router to reset the scroll when the provider says so', async () => {
      const { navigate } = await start('/articles', undefined, ScrollingRoot);

      await click('button', 'Sort by title');

      expect(navigate).toHaveBeenCalledExactlyOnceWith({
        href: '/articles?sort=title',
        replace: false,
        resetScroll: true,
      });
    });

    it('should ask TanStack Router to reset the scroll when the hook says so', async () => {
      const { navigate } = await start('/scrolling');

      await click('button', 'Sort by title');

      expect(navigate).toHaveBeenCalledExactlyOnceWith({
        href: '/scrolling?sort=title',
        replace: false,
        resetScroll: true,
      });
    });

    it('should read the scroll prop on the first render only', async () => {
      const { navigate } = await start('/articles', undefined, TogglingRoot);

      await click('button', 'Stop scrolling');
      await click('button', 'Sort by title');

      expect(navigate).toHaveBeenCalledExactlyOnceWith({
        href: '/articles?sort=title',
        replace: false,
        resetScroll: true,
      });
    });
  });

  describe('as an argument', () => {
    it('should drive a list without a provider', async () => {
      await start('/passed?page=4');

      await click('button', 'passed page 4');

      expect(screen.getByRole('button').textContent).toBe('passed page 5');
    });

    it('should keep the same adapter while the location is unchanged', async () => {
      await start('/probe');

      const before = probed.length;

      await click('button', 'tick 0');

      expect(probed.length).toBeGreaterThan(before);
      expect(probed.at(-1)).toBe(probed.at(before - 1));
    });
  });
});
