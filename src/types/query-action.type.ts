import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';

/**
 * What can happen to a {@link QueryState}.
 *
 * Internal: {@link useQubeeQuery} dispatches these.
 *
 * @typeParam T - The shape of a row
 */
export type QueryAction<T extends PaginatedObject> =
  | {
      /** The value of the `refetch()` counter when the request started. */
      attempt: number;
      /** The page the request answered with. */
      data: PaginatedResult<T>;
      /** The key of the request. */
      key: string;
      /** The request succeeded. */
      type: 'answered';
    }
  | {
      /** The value of the `refetch()` counter when the request started. */
      attempt: number;
      /** Why the request failed. */
      error: Error;
      /** The key of the request. */
      key: string;
      /** The request failed. */
      type: 'failed';
    }
  | {
      /** Nothing is asked for any more: forget the last answer. */
      type: 'cleared';
    };
