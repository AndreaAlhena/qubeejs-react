import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import type { ReactRouterAdapterOptions } from '../types/react-router-adapter-options.type';
import type { RouterAdapter } from '../types/router-adapter.type';

/**
 * React Router as a {@link RouterAdapter}: its location in, its `navigate` out.
 *
 * Call it inside a React Router tree — declarative, data or framework mode. Pass the result to
 * {@link useQubeeList} for one list, or wrap the routes in {@link ReactRouterAdapter} and every
 * list below finds it.
 *
 * A list navigation keeps the scroll position: where the app renders `<ScrollRestoration>`, React
 * Router would otherwise scroll to the top each time a filter or a page number changes.
 *
 * @param options - `scroll`: let React Router reset the scroll position; `false` by default
 * @returns The current pathname and query, and a `navigate` that goes through React Router
 *
 * @example
 * ```tsx
 * function Articles(): ReactElement {
 *   const list = useQubeeList(articleList, useReactRouterAdapter());
 *
 *   return <Link to={list.href({ page: 2 })}>2</Link>;
 * }
 * ```
 */
export function useReactRouterAdapter(options: ReactRouterAdapterOptions = {}): RouterAdapter {
  const { scroll = false } = options;
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href, { replace }): void => {
        // React Router's navigate may return a promise; the list does not wait for it.
        void navigate(href, { preventScrollReset: !scroll, replace });
      },
      pathname,
      search,
    }),
    [navigate, pathname, scroll, search]
  );
}
