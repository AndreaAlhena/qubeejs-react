import type { ReactElement } from 'react';

import { buildListHref, buildListRequest, readListState } from '@qubeejs/core';

import { articleList } from '../../lib/article-list';
import { ArticlesView } from './articles-view';

type ArticlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A Server Component: it reads the list state, builds the request and builds a link with the
 * core, which never imports React. Reading `searchParams` makes the route dynamic.
 */
export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps): Promise<ReactElement> {
  const search = await searchParams;
  const state = readListState(articleList, search);
  const request = buildListRequest(articleList, state);

  return (
    <main>
      <h1>Articles</h1>
      <p>
        Server page: <output id="server-page">{state.page}</output>
      </p>
      <p>
        Server request: <output id="server-uri">{request.uri}</output>
      </p>
      <a
        href={buildListHref(articleList, { pathname: '/articles', search }, { page: 1 })}
        id="server-first"
      >
        First page
      </a>
      <ArticlesView />
    </main>
  );
}
