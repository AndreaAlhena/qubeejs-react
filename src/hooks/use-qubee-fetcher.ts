import { useContext } from 'react';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';

import { fetcherContext } from '../contexts/fetcher-context';

/**
 * Resolve the fetcher of a fetching hook: the one it was given, else the nearest
 * {@link QubeeFetchProvider}'s, else none — and `fetchQubeePage` then uses the global `fetch`.
 *
 * Internal: {@link useQubeeQuery} and `useQubeeSWR` call it.
 *
 * @param fetcher - The hook's own `fetcher` option
 * @returns The fetcher to use, or `undefined` for the global `fetch`
 */
export function useQubeeFetcher(fetcher: QubeeFetcher | undefined): QubeeFetcher | undefined {
  const provided = useContext(fetcherContext);

  return fetcher ?? provided ?? undefined;
}
