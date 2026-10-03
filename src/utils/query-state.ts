import type { PaginatedObject, PaginatedResult } from '@qubeejs/core';

import type { QueryAction } from '../types/query-action.type';
import type { QueryState } from '../types/query-state.type';

/**
 * The state a query starts in.
 *
 * `initialData` is the answer to the request present on the first render, so that request counts
 * as answered and is not fetched. Without a request there is nothing it could answer.
 *
 * @typeParam T - The shape of a row
 * @param key - The key of the first render's request, or `null` when nothing is asked for
 * @param initialData - The page of that request, when the caller already has it
 * @returns The state before any request
 */
export function createQueryState<T extends PaginatedObject>(
  key: null | string,
  initialData: PaginatedResult<T> | undefined
): QueryState<T> {
  return key !== null && initialData !== undefined
    ? { attempt: 0, data: initialData, error: undefined, key }
    : { attempt: 0, data: undefined, error: undefined, key: null };
}

/**
 * Apply one event to the state of a query.
 *
 * A failure discards the data, so a page is never shown under the state of another request —
 * unless the failed request is the one the data answers, fetched again: then the data stays.
 *
 * A fetch that starts for another request sets the answer aside: its page stays, to be shown as
 * the previous page, but it no longer answers anything. Coming back to its request therefore
 * fetches again, whichever of the two requests would have been answered first.
 *
 * @typeParam T - The shape of a row
 * @param state - The last answer
 * @param action - What happened
 * @returns The next state; the same object when nothing changes
 */
export function reduceQueryState<T extends PaginatedObject>(
  state: QueryState<T>,
  action: QueryAction<T>
): QueryState<T> {
  switch (action.type) {
    case 'answered':
      return { attempt: action.attempt, data: action.data, error: undefined, key: action.key };
    case 'cleared':
      return state.key === null && state.data === undefined
        ? state
        : { attempt: state.attempt, data: undefined, error: undefined, key: null };
    case 'failed':
      return {
        attempt: action.attempt,
        data: state.key === action.key ? state.data : undefined,
        error: action.error,
        key: action.key,
      };
    case 'started':
      return state.key === null || state.key === action.key
        ? state
        : { attempt: state.attempt, data: state.data, error: undefined, key: null };
  }
}
