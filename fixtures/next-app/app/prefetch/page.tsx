import type { ReactElement } from 'react';

import { buildListRequest, readListState } from '@qubeejs/core';
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { type Article, articleList } from '../../lib/article-list';
import { PrefetchedView } from './prefetched-view';
import { QueryProvider } from './query-provider';

type PrefetchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A Server Component that prefetches with the TanStack Query entry: `qubeeQueryOptions` is not a
 * client function, so it can be called here, and the cache it fills travels to the browser.
 */
export default async function PrefetchPage({
  searchParams,
}: PrefetchPageProps): Promise<ReactElement> {
  const request = buildListRequest(articleList, readListState(articleList, await searchParams));
  const client = new QueryClient();

  await client.prefetchQuery(qubeeQueryOptions<Article>(request));

  return (
    <main>
      <h1>Prefetched</h1>
      <QueryProvider>
        <HydrationBoundary state={dehydrate(client)}>
          <PrefetchedView />
        </HydrationBoundary>
      </QueryProvider>
    </main>
  );
}
