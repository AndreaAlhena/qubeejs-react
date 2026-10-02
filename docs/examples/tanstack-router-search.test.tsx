import { useQubeeList } from '@qubeejs/react';
import { TanStackRouterAdapter } from '@qubeejs/react/tanstack-router';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { articleList } from './article-list';
import { ArticleSearch } from './article-search';
import { parseSearch, stringifySearch } from './tanstack-router-search';

function Articles() {
  return <ArticleSearch list={useQubeeList(articleList)} />;
}

/** Render the search box at /articles, on a router with the given search serialisers. */
async function renderSearch(serialisers: Parameters<typeof createRouter>[0] = {}) {
  const rootRoute = createRootRoute({
    component: () => (
      <TanStackRouterAdapter>
        <Outlet />
      </TanStackRouterAdapter>
    ),
  });
  const history = createMemoryHistory({ initialEntries: ['/articles'] });
  const router = createRouter({
    ...serialisers,
    history,
    routeTree: rootRoute.addChildren([
      createRoute({ component: Articles, getParentRoute: () => rootRoute, path: '/articles' }),
    ]),
  });

  await act(async () => {
    render(<RouterProvider router={router} />);
    await router.load();
  });

  return {
    history,
    input: screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search articles' }),
  };
}

/** Type `value`, then wait for the debounce and for the router to settle. */
async function typeAndWait(input: HTMLInputElement, value: string) {
  await act(async () => {
    fireEvent.change(input, { target: { value } });
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

describe('a search box on TanStack Router', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should lose a trailing space after a number with the router's default serialisers", async () => {
    const { history, input } = await renderSearch();

    await typeAndWait(input, '10 ');

    expect(history.location.search).toBe('?q=10');
    expect(input.value).toBe('10');
  });

  it('should keep what was typed with the plain-text serialisers', async () => {
    const { history, input } = await renderSearch({ parseSearch, stringifySearch });

    await typeAndWait(input, '10 ');

    expect(history.location.search).toBe('?q=10+');
    expect(input.value).toBe('10 ');
  });

  it('should keep quotes and digits as typed with the plain-text serialisers', async () => {
    const { input } = await renderSearch({ parseSearch, stringifySearch });

    await typeAndWait(input, '"react hooks" 1.50');

    expect(input.value).toBe('"react hooks" 1.50');
  });
});

describe('the plain-text serialisers', () => {
  it('should read every value as the text it is in the URL', () => {
    expect(parseSearch('?q=1.50&page=2&draft=true')).toEqual({
      draft: 'true',
      page: '2',
      q: '1.50',
    });
  });

  it('should read a repeated name as a list', () => {
    expect(parseSearch('tag=a&tag=b&tag=c')).toEqual({ tag: ['a', 'b', 'c'] });
  });

  it('should write a list as a repeated name, and leave out what is not set', () => {
    expect(stringifySearch({ page: 2, q: undefined, sort: null, tag: ['a', 'b'] })).toBe(
      '?page=2&tag=a&tag=b'
    );
  });

  it('should write nothing for an empty search', () => {
    expect(stringifySearch({})).toBe('');
  });
});
