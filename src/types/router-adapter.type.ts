import type { SearchParamsInput } from '@qubeejs/core';

import type { AdapterNavigateOptions } from './adapter-navigate-options.type';

/**
 * What {@link useQubeeList} needs from a router: where the page is, and how to go somewhere
 * else.
 *
 * Build it on every render from the router's own hooks, so reactivity comes from the router; the
 * hook never relies on the object's identity. {@link useBrowserAdapter} is one for apps without a
 * router, and the entries `@qubeejs/react/react-router`, `@qubeejs/react/tanstack-router` and
 * `@qubeejs/react/next` ship one for each of those routers. For any other router, write the hook
 * and hand it to {@link createAdapterProvider}.
 *
 * @example
 * ```ts
 * function useMyRouterAdapter(): RouterAdapter {
 *   const router = useMyRouter();
 *
 *   return {
 *     navigate: (href, { replace }) => (replace ? router.replace(href) : router.push(href)),
 *     pathname: router.pathname,
 *     search: router.search,
 *   };
 * }
 * ```
 */
export type RouterAdapter = {
  /** Go to `href`: a pathname plus an optional `?query`, as `buildListHref` builds it. */
  navigate: (href: string, options: AdapterNavigateOptions) => void;
  /** The current pathname, without the query. */
  pathname: string;
  /** The current query: `URLSearchParams`, a string with or without `?`, or Next's record. */
  search: SearchParamsInput;
};
