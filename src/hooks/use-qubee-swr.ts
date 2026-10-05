import type { ListRequest, PaginatedObject, PaginatedResult } from '@qubeejs/core';
import type { SWRResponse } from 'swr';

import { useState } from 'react';
import useSWR, { unstable_serialize, useSWRConfig } from 'swr';

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
 * A `null` request fetches nothing and shows no page — or the `fallbackData` you gave it — as with
 * {@link useQubeeQuery}: `keepPreviousData` keeps a page while the next request loads, never
 * across a `null` one. The request that follows a `null` one shows no page from before it until
 * it has a page of its own in SWR's cache; if it fails instead, the next request does not keep it
 * either.
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
  const { fetcher: ownFetcher, keepPreviousData = true, ...config } = options;
  const fetcher = useQubeeFetcher(ownFetcher);
  const { cache } = useSWRConfig();
  const key: null | QubeeQueryKey = request ? ['qubee', request.uri, request.headers] : null;
  // SWR keeps the last page it showed, even across a `null` key, and shows it again for the next
  // key until that one has data of its own. After a `null` request, the hook therefore asks for
  // no previous page until the request that follows has a page in SWR's cache — not merely
  // `data`, which `fallbackData` fills at once.
  const [isAfterNull, setIsAfterNull] = useState(request === null);
  const response = useSWR<PaginatedResult<T>, Error, null | QubeeQueryKey>(
    key,
    request ? (): Promise<PaginatedResult<T>> => fetchQubeePage<T>(request, { fetcher }) : null,
    { ...config, keepPreviousData: keepPreviousData && !isAfterNull && request !== null }
  );
  const hasOwnPage = key !== null && cache.get(unstable_serialize(key))?.data !== undefined;

  if (request === null && !isAfterNull) {
    setIsAfterNull(true);
  }

  if (request !== null && isAfterNull && hasOwnPage) {
    setIsAfterNull(false);
  }

  return response;
}
