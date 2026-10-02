'use client';

import type { PaginatedResult } from '@qubeejs/core';
import { useQubeeList } from '@qubeejs/react';
import Link from 'next/link';

import { type Article, articleList } from '@/articles/article-list';

import { useNextListRouter } from './use-next-list-router';

type ArticleListViewProps = {
  nextHref: string;
  result: PaginatedResult<Article>;
};

/** The interactive half of /articles: the search box, and the page the server fetched. */
export function ArticleListView({ nextHref, result }: ArticleListViewProps) {
  const list = useQubeeList(articleList, useNextListRouter());

  return (
    <section aria-busy={list.isPending}>
      <input
        aria-label="Search articles"
        onChange={(event) => list.set({ q: event.target.value }, { debounce: 300, replace: true })}
        type="search"
        value={list.state.q ?? ''}
      />
      <ul>
        {result.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      {list.state.page < (result.lastPage ?? 1) && <Link href={nextHref}>Next page</Link>}
    </section>
  );
}
