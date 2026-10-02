import type { ListRequest, PaginatedObject, PaginatedResult } from '@qubeejs/core';
import type {
  DataTag,
  UndefinedInitialDataOptions,
  UnusedSkipTokenOptions,
} from '@tanstack/react-query';

import { queryOptions, skipToken } from '@tanstack/react-query';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';
import type { QubeeQueryKey } from '../types/qubee-query-key.type';

import { fetchQubeePage } from './fetch-qubee-page';

/**
 * The TanStack Query options that fetch the page a request asks for.
 *
 * It returns what TanStack's own `queryOptions()` returns, with two things set: the `queryKey` —
 * `['qubee', uri, headers]` — and a `queryFn` that calls {@link fetchQubeePage} with TanStack's
 * abort signal. Everything else is yours to add, so the object works with `useQuery`,
 * `useSuspenseQuery`, `useQueries`, `prefetchQuery` and `ensureQueryData`.
 *
 * It is a plain function that also runs outside React — in a loader, on the server — so it takes
 * the fetcher as an argument and does not read `QubeeFetchProvider`.
 *
 * @typeParam T - The shape of a row
 * @param request - The page to fetch: `list.request`, or core's `buildListRequest()`
 * @param options - `fetcher`: what performs the request, the global `fetch` by default
 * @returns The options, typed so that `data` is core's `PaginatedResult<T>`
 *
 * @example
 * ```tsx
 * const list = useQubeeList(articleList);
 * const articles = useQuery({
 *   ...qubeeQueryOptions<Article>(list.request),
 *   placeholderData: keepPreviousData,
 * });
 * ```
 */
export function qubeeQueryOptions<T extends PaginatedObject>(
  request: ListRequest,
  options?: { fetcher?: QubeeFetcher }
): UnusedSkipTokenOptions<PaginatedResult<T>, Error, PaginatedResult<T>, QubeeQueryKey> & {
  queryKey: DataTag<QubeeQueryKey, PaginatedResult<T>, Error>;
};

/**
 * The same, for a request that may be `null`: the `queryFn` is then TanStack's `skipToken`, and
 * the query fetches nothing.
 *
 * @typeParam T - The shape of a row
 * @param request - The page to fetch, or `null` for none
 * @param options - `fetcher`: what performs the request, the global `fetch` by default
 * @returns The options; they do not fit `useSuspenseQuery`, which cannot skip
 */
export function qubeeQueryOptions<T extends PaginatedObject>(
  request: ListRequest | null,
  options?: { fetcher?: QubeeFetcher }
): UndefinedInitialDataOptions<PaginatedResult<T>, Error, PaginatedResult<T>, QubeeQueryKey> & {
  queryKey: DataTag<QubeeQueryKey, PaginatedResult<T>, Error>;
};

/**
 * The implementation behind both signatures.
 *
 * @typeParam T - The shape of a row
 * @param request - The page to fetch, or `null` for none
 * @param options - `fetcher`: what performs the request
 * @returns The options
 */
export function qubeeQueryOptions<T extends PaginatedObject>(
  request: ListRequest | null,
  options: { fetcher?: QubeeFetcher } = {}
): UndefinedInitialDataOptions<PaginatedResult<T>, Error, PaginatedResult<T>, QubeeQueryKey> & {
  queryKey: DataTag<QubeeQueryKey, PaginatedResult<T>, Error>;
} {
  return queryOptions<PaginatedResult<T>, Error, PaginatedResult<T>, QubeeQueryKey>({
    queryFn: request
      ? ({ signal }): Promise<PaginatedResult<T>> =>
          fetchQubeePage<T>(request, { fetcher: options.fetcher, signal })
      : skipToken,
    queryKey: ['qubee', request?.uri ?? null, request?.headers ?? null],
  });
}
