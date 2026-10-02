import { useBrowserAdapter, useQubeeList, useQubeeQuery } from '@qubeejs/react';

import { type Article, articleList, ArticleStatusEnum } from './article-list';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/** Articles, searched, filtered, sorted and paged through the URL. */
export function ArticlesPage() {
  const router = useBrowserAdapter();
  const list = useQubeeList(articleList, router);
  const articles = useQubeeQuery<Article>(list.request);
  const { state } = list;
  const lastPage = articles.data?.lastPage ?? 1;

  return (
    <main aria-busy={list.isPending || articles.isFetching}>
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
      {articles.error && <p role="alert">The articles could not be loaded.</p>}
      <ul>
        {articles.data?.data.map((article) => (
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
