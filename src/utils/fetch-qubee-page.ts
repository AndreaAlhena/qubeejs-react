import type { ListRequest, PaginatedObject, PaginatedResult, RawResponse } from '@qubeejs/core';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';

import { QubeeFetchError } from '../errors/qubee-fetch.error';

/**
 * Fetch one page of a list and parse it with the driver that built the request.
 *
 * It sends the request's headers — the page, for drivers that paginate through headers — hands
 * the response headers to the parser, and returns a plain object: it can be cached, compared,
 * and passed from a Server Component to a Client Component.
 *
 * This is the one function of the package that performs I/O. It runs anywhere: in a Server
 * Component, a route loader, a script, or under the fetching hooks, which all call it.
 *
 * @typeParam T - The shape of a row
 * @param request - What to fetch: `list.request` from `useQubeeList`, or core's
 * `buildListRequest()`
 * @param options - `fetcher`: what performs the request, the global `fetch` by default; `signal`:
 * aborts it
 * @returns The rows and the page metadata, as core's `toPlain()` returns them
 * @throws {QubeeFetchError} When the response's status is not `ok`
 *
 * @example
 * ```ts
 * const request = buildListRequest(articleList, readListState(articleList, await searchParams));
 * const page = await fetchQubeePage<Article>(request);
 * ```
 */
export async function fetchQubeePage<T extends PaginatedObject>(
  request: ListRequest,
  options: { fetcher?: QubeeFetcher; signal?: AbortSignal } = {}
): Promise<PaginatedResult<T>> {
  const { fetcher = fetch, signal } = options;
  const response = await fetcher(request.uri, { headers: { ...request.headers }, signal });

  if (!response.ok) {
    throw new QubeeFetchError(request.uri, response);
  }

  const body = (await response.json()) as RawResponse;

  return request.paginate<T>(body, response.headers).toPlain();
}
