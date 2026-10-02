import { useQubeeList, useQubeeQuery } from '@qubeejs/react';
import type { MouseEvent } from 'react';

import { type Article, articleList } from './article-list';
import { isPlainClick } from './plain-click';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The articles route. It names no router: the list takes its adapter from the
 * `<TanStackRouterAdapter>` at the root route.
 */
export function ArticlesPage() {
  const list = useQubeeList(articleList);
  const articles = useQubeeQuery<Article>(list.request);
  const { page, q } = list.state;
  const lastPage = articles.data?.lastPage ?? 1;

  /** A real link to a page, that navigates in place on a plain click. */
  const pageLink = (target: number) => ({
    href: list.href({ page: target }),
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isPlainClick(event)) {
        return;
      }

      event.preventDefault();
      list.setPage(target);
    },
  });

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
        {page > 1 && <a {...pageLink(page - 1)}>Previous</a>}
        {page < lastPage && <a {...pageLink(page + 1)}>Next</a>}
      </nav>
    </main>
  );
}
