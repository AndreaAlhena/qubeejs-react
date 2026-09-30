import { useMemo, useSyncExternalStore } from 'react';

import type { ListRouter } from '../types/list-router.type';

import {
  navigateBrowserHistory,
  readBrowserLocation,
  readServerLocation,
  subscribeToBrowserHistory,
} from '../utils/browser-history';
import { pathnameOfHref, searchOfHref } from '../utils/href';

/**
 * A {@link ListRouter} for apps without a router: `history.pushState` / `replaceState`, plus the
 * back and forward buttons.
 *
 * Every instance on the page stays in sync, because navigations fan out to all of them. On the
 * server the location is empty.
 *
 * @returns The current pathname and query, and a `navigate` that moves the browser
 *
 * @example
 * ```tsx
 * function Articles(): ReactElement {
 *   const list = useListState(articleList, useBrowserRouter());
 *
 *   return <a href={list.href({ page: 2 })}>2</a>;
 * }
 * ```
 */
export function useBrowserRouter(): ListRouter {
  const location = useSyncExternalStore(
    subscribeToBrowserHistory,
    readBrowserLocation,
    readServerLocation
  );

  return useMemo(
    (): ListRouter => ({
      navigate: navigateBrowserHistory,
      pathname: pathnameOfHref(location),
      search: searchOfHref(location),
    }),
    [location]
  );
}
