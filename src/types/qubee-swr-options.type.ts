import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';
import type { SWRConfiguration } from 'swr';

import type { QubeeFetcher } from './qubee-fetcher.type';

/**
 * Options of {@link useQubeeSWR}: SWR's own configuration — `fallbackData`, `revalidateOnFocus`,
 * `refreshInterval` and the rest — with its `fetcher` replaced by a {@link QubeeFetcher}.
 *
 * @typeParam T - The shape of a row
 */
export type QubeeSWROptions<T extends PaginatedObject = PaginatedObject> = Omit<
  SWRConfiguration<PaginatedResult<T>, Error>,
  'fetcher'
> & {
  /**
   * What performs the request, in place of the nearest {@link QubeeFetchProvider}'s fetcher. It
   * has the shape of `fetch`, not of an SWR fetcher: it gets the address and the headers.
   */
  fetcher?: QubeeFetcher;
};
