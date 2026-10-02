import { useQubeeList, useQubeeQuery } from '@qubeejs/react';
import { Link } from 'react-router';

import { type Article, articleList } from './article-list';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The articles route. It names no router: the list takes its adapter from the
 * `<ReactRouterAdapter>` at the root route, and its links are React Router's.
 */
export function ArticlesPage() {
  const list = useQubeeList(articleList);
  const articles = useQubeeQuery<Article>(list.request);
  const { page, q } = list.state;
  const lastPage = articles.data?.lastPage ?? 1;

  return (
    <main aria-busy={list.isPending || articles.isFetching}>
      <input
        aria-label="Search articles"
        onChange={(event) =>
          list.set({ q: event.target.value }, { debounce: SEARCH_DEBOUNCE_MS, replace: true })
        }
        type="search"
        value={q ?? ''}
      />
      <ul>
        {articles.data?.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      <nav aria-label="Pagination">
        {page > 1 && <Link to={list.href({ page: page - 1 })}>Previous</Link>}
        {page < lastPage && <Link to={list.href({ page: page + 1 })}>Next</Link>}
      </nav>
    </main>
  );
}
