import type { PaginatedResult } from '@qubeejs/core';
import { useBrowserRouter, useListState } from '@qubeejs/react';
import { useEffect, useState } from 'react';

import { type Article, articleList } from './article-list';
import { ArticleSearch } from './article-search';
import { ArticleTable } from './article-table';
import { fetchPage } from './fetch-page';
import { PaginationBar } from './pagination-bar';
import { ResultRange } from './result-range';
import { StatusChips } from './status-chips';

/**
 * The article list, whole. One useListState serves every control, so the page
 * dims while the search box's change is pending.
 */
export function ArticleIndex() {
  const router = useBrowserRouter();
  const list = useListState(articleList, router);
  const [result, setResult] = useState<PaginatedResult<Article> | null>(null);
  const { request } = list;

  useEffect(() => {
    const controller = new AbortController();

    fetchPage<Article>(request, controller.signal)
      .then(setResult)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, [request]);

  return (
    <section>
      <ArticleSearch list={list} />
      <StatusChips list={list} />
      <div aria-busy={list.isPending}>
        <ArticleTable articles={result?.data ?? []} list={list} />
        {result && <ResultRange result={result} />}
      </div>
      <PaginationBar lastPage={result?.lastPage ?? 1} list={list} />
    </section>
  );
}
