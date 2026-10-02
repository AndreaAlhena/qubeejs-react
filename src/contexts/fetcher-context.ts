import { createContext } from 'react';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';

/**
 * Carries the nearest {@link QubeeFetchProvider}'s fetcher. `null` outside any provider, where
 * the fetching hooks use the global `fetch`.
 *
 * Internal: {@link useQubeeFetcher} reads it.
 */
export const fetcherContext = createContext<null | QubeeFetcher>(null);
