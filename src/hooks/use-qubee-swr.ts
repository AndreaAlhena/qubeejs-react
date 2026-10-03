import type { ListRequest, PaginatedObject, PaginatedResult } from '@qubeejs/core';
import type { SWRResponse } from 'swr';

import useSWR from 'swr';

import type { QubeeQueryKey } from '../types/qubee-query-key.type';
import type { QubeeSWROptions } from '../types/qubee-swr-options.type';

import { fetchQubeePage } from '../utils/fetch-qubee-page';
import { useQubeeFetcher } from './use-qubee-fetcher';

/**
 * Fetch the page a request asks for through SWR.
 *
 * It is `useSWR` with the key `['qubee', uri, headers]`, a fetcher that calls
 * {@link fetchQubeePage}, and `keepPreviousData` on, so the previous page stays while the next
 * one loads. Everything else is SWR's: its cache, de-duplication, revalidation and `mutate`.
 *
 * Pass `list.request` from {@link useQubeeList}: it follows the committed state, so the key
 * changes once per navigation, never per keystroke. What performs the request is the `fetcher`
 * option, else the nearest {@link QubeeFetchProvider}'s, else the global `fetch`.
 *
 * @typeParam T - The shape of a row
 * @param request - The page to fetch; `null` fetches nothing
 * @param options - SWR's configuration, with `fetcher` a {@link QubeeFetcher}
 * @returns What `useSWR` returns, with `data` typed as core's `PaginatedResult<T>`
 *
 * @example
 * ```tsx
 * const list = useQubeeList(articleList);
 * const { data, error, isValidating } = useQubeeSWR<Article>(list.request);
 * ```
 */
export function useQubeeSWR<T extends PaginatedObject>(
  request: ListRequest | null,
  options: QubeeSWROptions<T> = {}
): SWRResponse<PaginatedResult<T>, Error> {
  const { fetcher: ownFetcher, ...config } = options;
  const fetcher = useQubeeFetcher(ownFetcher);

  return useSWR<PaginatedResult<T>, Error, null | QubeeQueryKey>(
    request ? ['qubee', request.uri, request.headers] : null,
    request ? (): Promise<PaginatedResult<T>> => fetchQubeePage<T>(request, { fetcher }) : null,
    { keepPreviousData: true, ...config }
  );
}
