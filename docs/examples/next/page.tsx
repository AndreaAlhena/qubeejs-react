import { buildListHref, buildListRequest, readListState } from '@qubeejs/core';
import { fetchQubeePage } from '@qubeejs/react/fetch';

import { type Article, articleList } from '@/articles/article-list';

import { ArticleListView } from './article-list-view';

type ArticlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** /articles, rendered on the server: read the URL, fetch the page, link onward. */
export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const search = await searchParams;
  const state = readListState(articleList, search);
  const result = await fetchQubeePage<Article>(buildListRequest(articleList, state));
  const nextHref = buildListHref(articleList, { pathname: '/articles', search }, { page: state.page + 1 });

  return <ArticleListView nextHref={nextHref} result={result} />;
}
