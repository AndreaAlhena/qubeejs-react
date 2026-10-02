import type { QubeeListHandle } from '@qubeejs/react';
import useSWR from 'swr';

import type { Article, articleList } from './article-list';
import { fetchQubeePage } from '@qubeejs/react/fetch';

/** The page the list's committed state asks for, cached by SWR. */
export function useArticlesSWR(list: QubeeListHandle<typeof articleList>) {
  const { request } = list;

  return useSWR(['articles', request.uri, request.headers], () => fetchQubeePage<Article>(request), {
    keepPreviousData: true,
  });
}
