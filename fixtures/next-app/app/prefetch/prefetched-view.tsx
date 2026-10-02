'use client';

import type { ReactElement } from 'react';

import { useQubeeList } from '@qubeejs/react';
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';
import { useQuery } from '@tanstack/react-query';

import { type Article, articleList } from '../../lib/article-list';

/** How long a page counts as fresh: long enough that the browser does not fetch what the server did. */
const STALE_TIME_MS = 60_000;

/**
 * The same options as the Server Component built, from the same request: the query finds the
 * page the server put in the cache, and fetches nothing.
 */
export function PrefetchedView(): ReactElement {
  const list = useQubeeList(articleList);
  const articles = useQuery({
    ...qubeeQueryOptions<Article>(list.request),
    staleTime: STALE_TIME_MS,
  });

  return (
    <section>
      <ul id="prefetched-rows">
        {articles.data?.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      <p>
        Fetch status: <output id="fetch-status">{articles.fetchStatus}</output>
      </p>
      <button id="prefetched-next" onClick={() => list.setPage(list.state.page + 1)} type="button">
        Next page
      </button>
    </section>
  );
}
