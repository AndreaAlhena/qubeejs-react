import { useMemo, useSyncExternalStore } from 'react';

import type { LocalStore } from '../types/local-store.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { searchOfHref } from '../utils/href';

/**
 * Follow an in-memory location and expose it as a {@link RouterAdapter}.
 *
 * Internal: {@link useMemoryAdapter} and {@link MemoryAdapter} share it. The pathname is empty,
 * and `navigate` replaces the query: there is no history, so `replace` makes no difference.
 *
 * @param location - The store that holds the query, without `?`
 * @returns The adapter for that location
 */
export function useMemoryLocation(location: LocalStore<string>): RouterAdapter {
  const search = useSyncExternalStore(
    location.subscribe,
    location.getSnapshot,
    location.getSnapshot
  );

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href: string): void => {
        location.update(() => searchOfHref(href));
      },
      pathname: '',
      search,
    }),
    [location, search]
  );
}
