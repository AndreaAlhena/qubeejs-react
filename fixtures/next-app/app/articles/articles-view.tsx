'use client';

import type { ReactElement } from 'react';

import { getAriaSort } from '@qubeejs/core';
import { useQubeeList } from '@qubeejs/react';
import Link from 'next/link';

import { articleList } from '../../lib/article-list';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/** The interactive half: it takes its adapter from the `<NextAdapter>` in the layout. */
export function ArticlesView(): ReactElement {
  const list = useQubeeList(articleList);
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
    </section>
  );
}
