import type { ListRequest, PaginatedObject } from '@qubeejs/core';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { QubeeQueryOptions } from '../types/qubee-query-options.type';
import type { QubeeQueryResult } from '../types/qubee-query-result.type';
import type { QueryAction } from '../types/query-action.type';

import { fetchQubeePage } from '../utils/fetch-qubee-page';
import { createQueryState, reduceQueryState } from '../utils/query-state';
import { requestKey } from '../utils/request-key';
import { useQubeeFetcher } from './use-qubee-fetcher';

/**
 * What a rejected request reports: the rejection itself when it is an `Error`, else an `Error`
 * that carries it as its `cause`.
 *
 * @param reason - What the fetcher, the parser or `fetchQubeePage` rejected with
 * @returns An `Error`
 */
function toError(reason: unknown): Error {
  return reason instanceof Error
    ? reason
    : new Error('The request was rejected with a value that is not an Error.', { cause: reason });
}

/**
 * Fetch the page a request asks for, and fetch again when the request changes.
 *
 * Pass `list.request` from {@link useQubeeList}: it follows the committed state, so the hook
 * fetches once per navigation, never per keystroke. A request is identified by its address and
 * its headers, not by object identity. When it changes, the request it replaces is aborted and
 * its answer, if one still arrives, is ignored; an abort is never an error. Unmounting aborts
 * too.
 *
 * While the next page loads, `data` is the previous page. A failure sets `error` and discards
 * the data, so a page is never shown under another request's state. `isFetching` is `true` from
 * the first render when a fetch is due — on the server too, where nothing is fetched — so the
 * server's HTML and the client's first render agree.
 *
 * It keeps no cache and shares nothing between components: two components that fetch the same
 * request fetch twice. Call it once and pass the result down, or use the TanStack Query or SWR
 * entry.
 *
 * @typeParam T - The shape of a row
 * @param request - The page to fetch; `null` fetches nothing
 * @param options - `enabled`, `fetcher`, `initialData`, `keepPreviousData`
 * @returns The page, the error, the two loading flags and `refetch`
 *
 * @example
 * ```tsx
 * const list = useQubeeList(articleList);
 * const articles = useQubeeQuery<Article>(list.request);
 *
 * <ul aria-busy={list.isPending || articles.isFetching}>
 *   {articles.data?.data.map((article) => <li key={article.id}>{article.title}</li>)}
 * </ul>
 * ```
 */
export function useQubeeQuery<T extends PaginatedObject>(
  request: ListRequest | null,
  options: QubeeQueryOptions<T> = {}
): QubeeQueryResult<T> {
  const { enabled = true, initialData, keepPreviousData = true } = options;
  const fetcher = useQubeeFetcher(options.fetcher);
  const key = enabled && request ? requestKey(request) : null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() => createQueryState(key, initialData));
  const isAnswered = state.key === key && state.attempt === attempt;
  // What a fetch is performed with is read when it starts, not tracked: a new request object for
  // the same page, or a new fetcher function, must not fetch again.
  const latest = useRef({ fetcher, request });

  useEffect(() => {
    latest.current = { fetcher, request };
  });

  useEffect(() => {
    const current = latest.current;
    const dispatch = (action: QueryAction<T>): void => {
      setState((previous) => reduceQueryState(previous, action));
    };

    if (key === null || current.request === null) {
      dispatch({ type: 'cleared' });

      return undefined;
    }

    if (isAnswered) {
      return undefined;
    }

    const controller = new AbortController();

    fetchQubeePage<T>(current.request, {
      fetcher: current.fetcher,
      signal: controller.signal,
    }).then(
      (data) => {
        if (!controller.signal.aborted) {
          dispatch({ attempt, data, key, type: 'answered' });
        }
      },
      (reason: unknown) => {
        if (!controller.signal.aborted) {
          dispatch({ attempt, error: toError(reason), key, type: 'failed' });
        }
      }
    );

    return (): void => {
      controller.abort();
    };
  }, [attempt, isAnswered, key]);

  const refetch = useCallback((): void => {
    setAttempt((count) => count + 1);
  }, []);

  const isCurrent = key !== null && state.key === key;
  const isFetching = key !== null && !isAnswered;
  const data = key !== null && (isCurrent || keepPreviousData) ? state.data : undefined;
  const error = isCurrent ? state.error : undefined;
  const isLoading = isFetching && data === undefined;

  return useMemo(
    () => ({ data, error, isFetching, isLoading, refetch }),
    [data, error, isFetching, isLoading, refetch]
  );
}
