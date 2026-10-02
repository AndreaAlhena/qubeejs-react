import type { QubeeListHandle } from '@qubeejs/react';
import useSWR from 'swr';

import type { Article, articleList } from './article-list';
import { fetchPage } from './fetch-page';

/** The page the list's committed state asks for, cached by SWR. */
export function useArticlesSWR(list: QubeeListHandle<typeof articleList>) {
  const { request } = list;

  return useSWR(['articles', request.uri, request.headers], () => fetchPage<Article>(request), {
    keepPreviousData: true,
  });
}
