import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';

import type { QubeeFetcher } from './qubee-fetcher.type';

/**
 * Options of {@link useQubeeQuery}.
 *
 * @typeParam T - The shape of a row
 */
export type QubeeQueryOptions<T extends PaginatedObject> = {
  /** `false` fetches nothing, as a `null` request does. Default `true`. */
  enabled?: boolean;
  /**
   * What performs the request, in place of the nearest {@link QubeeFetchProvider}'s fetcher. A
   * new function does not fetch again.
   */
  fetcher?: QubeeFetcher;
  /**
   * The page of the request present on the first render — fetched on the server, say. That
   * request is not fetched; every later one is.
   */
  initialData?: PaginatedResult<T>;
  /** Keep showing the previous page while the next one loads. Default `true`. */
  keepPreviousData?: boolean;
};
