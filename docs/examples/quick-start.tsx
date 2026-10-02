import type { PaginatedResult } from '@qubeejs/core';
import { useBrowserAdapter, useQubeeList } from '@qubeejs/react';
import { useEffect, useState } from 'react';

import { type Article, articleList, ArticleStatusEnum } from './article-list';
import { fetchPage } from './fetch-page';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/** Articles, searched, filtered, sorted and paged through the URL. */
export function ArticlesPage() {
  const router = useBrowserAdapter();
  const list = useQubeeList(articleList, router);
  const [result, setResult] = useState<PaginatedResult<Article> | null>(null);
  const { request, state } = list;

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

  const lastPage = result?.lastPage ?? 1;

  return (
    <main aria-busy={list.isPending}>
      <input
        aria-label="Search articles"
        onChange={(event) =>
          list.set({ q: event.target.value }, { debounce: SEARCH_DEBOUNCE_MS, replace: true })
        }
        type="search"
        value={state.q ?? ''}
      />
      <label>
        <input
          checked={state.status === ArticleStatusEnum.PUBLISHED}
          onChange={(event) =>
            list.set({ status: event.target.checked ? ArticleStatusEnum.PUBLISHED : undefined })
          }
          type="checkbox"
        />
        Published only
      </label>
      <button onClick={() => list.toggleSort('title')} type="button">
        Sort by title
      </button>
      <ul>
        {result?.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      <button disabled={state.page <= 1} onClick={() => list.setPage(state.page - 1)} type="button">
        Previous
      </button>
      <button
        disabled={state.page >= lastPage}
        onClick={() => list.setPage(state.page + 1)}
        type="button"
      >
        Next
      </button>
    </main>
  );
}
