import { useLocation, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';

import type { RouterAdapter } from '../types/router-adapter.type';
import type { TanStackRouterAdapterOptions } from '../types/tanstack-router-adapter-options.type';

/**
 * TanStack Router as a {@link RouterAdapter}: its location in, its `navigate` out.
 *
 * It reads the raw query string and navigates with whole hrefs, so the list keeps its own URL
 * format instead of TanStack's serialised search objects, and a `basepath` or a rewrite is
 * honoured. Call it inside a TanStack Router tree. Pass the result to {@link useQubeeList} for
 * one list, or wrap the routes in {@link TanStackRouterAdapter} and every list below finds it.
 *
 * A list navigation keeps the scroll position: TanStack Router would otherwise scroll to the top
 * each time a filter or a page number changes.
 *
 * @param options - `scroll`: scroll to the top on navigation; `false` by default
 * @returns The current pathname and query, and a `navigate` that goes through TanStack Router
 *
 * @example
 * ```tsx
 * function Articles(): ReactElement {
 *   const list = useQubeeList(articleList, useTanStackRouterAdapter());
 *
 *   return <a href={list.href({ page: 2 })}>2</a>;
 * }
 * ```
 */
export function useTanStackRouterAdapter(
  options: TanStackRouterAdapterOptions = {}
): RouterAdapter {
  const { scroll = false } = options;
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  const search = useLocation({ select: (location) => location.searchStr });

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href, { replace }): void => {
        // TanStack Router's navigate returns a promise; the list does not wait for it.
        void router.navigate({ href, replace, resetScroll: scroll });
      },
      pathname,
      search,
    }),
    [pathname, router, scroll, search]
  );
}
