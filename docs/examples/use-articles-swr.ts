import type { QubeeListHandle } from '@qubeejs/react';
import { useQubeeSWR } from '@qubeejs/react/swr';

import type { Article, articleList } from './article-list';

/** The page the list's committed state asks for, cached by SWR. */
export function useArticlesSWR(list: QubeeListHandle<typeof articleList>) {
  return useQubeeSWR<Article>(list.request, { revalidateOnFocus: false });
}
