import type { QubeeListHandle } from '@qubeejs/react';
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Article, articleList } from './article-list';

/**
 * The page the list's committed state asks for, cached by TanStack Query. The
 * key changes once per navigation — not per keystroke — because `request` is
 * built from the committed layer, after any debounce.
 */
export function useArticlesQuery(list: QubeeListHandle<typeof articleList>) {
  return useQuery({
    ...qubeeQueryOptions<Article>(list.request),
    placeholderData: keepPreviousData,
  });
}
