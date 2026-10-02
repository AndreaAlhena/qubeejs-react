import type { QubeeListHandle } from '@qubeejs/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Article, articleList } from './article-list';
import { fetchQubeePage } from '@qubeejs/react/fetch';

/**
 * The page the list's committed state asks for, cached by TanStack Query. The
 * key changes once per navigation — not per keystroke — because `request` is
 * built from the committed layer, after any debounce.
 */
export function useArticlesQuery(list: QubeeListHandle<typeof articleList>) {
  const { request } = list;

  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchQubeePage<Article>(request, { signal }),
    queryKey: ['articles', request.uri, request.headers],
  });
}
