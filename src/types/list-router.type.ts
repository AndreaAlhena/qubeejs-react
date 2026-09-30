import type { SearchParamsInput } from '@qubeejs/core';

import type { NavigateOptions } from './navigate-options.type';

/**
 * What {@link useListState} needs from a router: where the page is, and how to go somewhere
 * else.
 *
 * Build it on every render from the router's own hooks, so reactivity comes from the router; the
 * hook never relies on the object's identity. {@link useBrowserRouter} is one for apps without a
 * router; the README shows adapters for React Router, TanStack Router and Next.js.
 *
 * @example
 * ```ts
 * function useReactRouterList(): ListRouter {
 *   const [search] = useSearchParams();
 *   const navigate = useNavigate();
 *   const { pathname } = useLocation();
 *
 *   return { navigate: (href, { replace }) => void navigate(href, { replace }), pathname, search };
 * }
 * ```
 */
export type ListRouter = {
  /** Go to `href`: a pathname plus an optional `?query`, as `buildListHref` builds it. */
  navigate: (href: string, options: NavigateOptions) => void;
  /** The current pathname, without the query. */
  pathname: string;
  /** The current query: `URLSearchParams`, a string with or without `?`, or Next's record. */
  search: SearchParamsInput;
};
