import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';

/**
 * What {@link useQubeeQuery} returns.
 *
 * @typeParam T - The shape of a row
 */
export type QubeeQueryResult<T extends PaginatedObject> = {
  /**
   * The page of the current request. While the next request is in flight it is the previous
   * page, unless `keepPreviousData` is `false`. `undefined` before the first answer, after a
   * failure, and while nothing is asked for.
   */
  data: PaginatedResult<T> | undefined;
  /**
   * Why the current request failed: a {@link QubeeFetchError} for a status that is not `ok`,
   * else what the fetcher or the parser threw. `undefined` otherwise.
   */
  error: Error | undefined;
  /** A request is in flight. */
  isFetching: boolean;
  /** A request is in flight and there is no data to show. */
  isLoading: boolean;
  /** Fetch the current request again. The data stays while it does, and if it fails. */
  refetch: () => void;
};
