import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import type { RouterAdapter } from '../types/router-adapter.type';

/**
 * React Router as a {@link RouterAdapter}: its location in, its `navigate` out.
 *
 * Call it inside a React Router tree — declarative, data or framework mode. Pass the result to
 * {@link useQubeeList} for one list, or wrap the routes in {@link ReactRouterAdapter} and every
 * list below finds it.
 *
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
export function useReactRouterAdapter(): RouterAdapter {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href, { replace }): void => {
        // React Router's navigate may return a promise; the list does not wait for it.
        void navigate(href, { replace });
      },
      pathname,
      search,
    }),
    [navigate, pathname, search]
  );
}
