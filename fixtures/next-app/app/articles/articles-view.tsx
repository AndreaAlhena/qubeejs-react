'use client';

import type { PaginatedResult } from '@qubeejs/core';
import type { ReactElement } from 'react';

import { getAriaSort } from '@qubeejs/core';
import { useQubeeList, useQubeeQuery } from '@qubeejs/react';
import Link from 'next/link';

import { type Article, articleList } from '../../lib/article-list';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

type ArticlesViewProps = {
  /** The page of the URL the server rendered, when the server fetched it. */
  initialData?: PaginatedResult<Article>;
};

/**
 * The interactive half: it takes its adapter from the `<NextAdapter>` in the layout, and fetches
 * every page but the one the server handed it.
 */
export function ArticlesView({ initialData }: ArticlesViewProps): ReactElement {
  const list = useQubeeList(articleList);
  const articles = useQubeeQuery<Article>(list.request, { initialData });
  const { page, q, sort } = list.state;

  return (
    <section aria-busy={list.isPending}>
      <input
        aria-label="Search articles"
        id="search"
        onChange={(event) =>
          list.set({ q: event.target.value }, { debounce: SEARCH_DEBOUNCE_MS, replace: true })
        }
        type="search"
        value={q ?? ''}
      />
      <table>
        <thead>
          <tr>
            <th aria-sort={getAriaSort(sort, 'title')} id="title-header">
              <button id="sort-title" onClick={() => list.toggleSort('title')} type="button">
                Title
              </button>
            </th>
          </tr>
        </thead>
      </table>
      <Link href={list.href({ page: page + 1 })} id="next-link">
        Next page
      </Link>
      <button id="next-button" onClick={() => list.setPage(page + 1)} type="button">
        Next page (button)
      </button>
      <button id="reset" onClick={() => list.reset()} type="button">
        Reset
      </button>
      <Link href="/other" id="away">
        Elsewhere
      </Link>
      <Link href="/slow" id="slow-link" prefetch={false}>
        Somewhere slow
      </Link>
      <p>
        Client page: <output id="client-page">{page}</output>
      </p>
      <p>
        Client request: <output id="client-uri">{list.request.uri}</output>
      </p>
      <p>
        Pending: <output id="pending">{String(list.isPending)}</output>
      </p>
      <ul aria-busy={articles.isFetching} id="rows">
        {articles.data?.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      <p>
        Fetching: <output id="fetching">{String(articles.isFetching)}</output>
      </p>
    </section>
  );
}
