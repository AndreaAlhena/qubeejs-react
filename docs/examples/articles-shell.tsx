import { createQubee, type RawResponse, SortEnum, STRAPI_DRIVER } from '@qubeejs/core';
import { QubeeProvider, useQubeeContext } from '@qubeejs/react';
import { useEffect, useState } from 'react';

import { API_URL, type Article, ArticleStatusEnum } from './article-list';

/** Articles, filtered and paged in memory: three components sharing one query. */
export function ArticlesShell() {
  // Created once, and configured before anything subscribes. Strict Mode may call
  // this initializer twice and keep one result; each call builds a fresh instance.
  const [qubee] = useState(() => {
    const instance = createQubee({ baseUrl: API_URL, driver: STRAPI_DRIVER });

    instance.builder.setResource('articles').addSort('publishedAt', SortEnum.DESC).setLimit(20);

    return instance;
  });

  return (
    <QubeeProvider value={qubee}>
      <StatusFilter />
      <ArticleRows />
      <Pager />
    </QubeeProvider>
  );
}

/** The rows for the query the shared instance holds now. */
export function ArticleRows() {
  const { builder, paginator } = useQubeeContext();
  const [articles, setArticles] = useState<Article[]>([]);
  const uri = builder.generateUri();

  useEffect(() => {
    const controller = new AbortController();

    fetch(uri, { signal: controller.signal })
      .then((response) => response.json() as Promise<RawResponse>)
      .then((body) => setArticles(paginator.paginate<Article>(body).data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, [paginator, uri]);

  return (
    <ul>
      {articles.map((article) => (
        <li key={article.id}>{article.title}</li>
      ))}
    </ul>
  );
}

/** Previous and next, with the last page once a response has reported it. */
export function Pager() {
  const { builder, state } = useQubeeContext();

  return (
    <nav aria-label="Pagination">
      <button disabled={builder.isFirstPage()} onClick={() => builder.previousPage()} type="button">
        Previous
      </button>
      <span>
        Page {state.page}
        {state.isLastPageKnown && ` of ${state.lastPage}`}
      </span>
      <button disabled={!builder.hasNextPage()} onClick={() => builder.nextPage()} type="button">
        Next
      </button>
    </nav>
  );
}

/** A checkbox that narrows the shared query to published articles. */
export function StatusFilter() {
  const { builder, state } = useQubeeContext();
  const isPublishedOnly = state.filters['status']?.includes(ArticleStatusEnum.PUBLISHED) ?? false;

  return (
    <label>
      <input
        checked={isPublishedOnly}
        onChange={(event) => {
          if (event.target.checked) {
            builder.addFilter('status', ArticleStatusEnum.PUBLISHED);

            return;
          }

          builder.deleteFilters('status');
        }}
        type="checkbox"
      />
      Published only
    </label>
  );
}
