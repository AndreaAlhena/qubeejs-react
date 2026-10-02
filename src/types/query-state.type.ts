import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';

/**
 * The last answer {@link useQubeeQuery} got, and the request it answers.
 *
 * Internal. What the hook returns is derived from it and from the request of the current render,
 * so "a request is in flight" needs no state of its own: it is simply "the answer held here is
 * not the answer to the current request".
 *
 * @typeParam T - The shape of a row
 */
export type QueryState<T extends PaginatedObject> = {
  /** How many times `refetch()` had been called when the answered request started. */
  attempt: number;
  /** The page, when the request succeeded. */
  data: PaginatedResult<T> | undefined;
  /** The failure, when it did not. */
  error: Error | undefined;
  /** The key of the answered request; `null` while nothing has been answered. */
  key: null | string;
};
