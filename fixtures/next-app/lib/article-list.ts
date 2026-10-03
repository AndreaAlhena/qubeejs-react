import {
  defineList,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

/** An article as the app's stand-in API returns it. */
export type Article = {
  id: number;
  publishedAt: string;
  title: string;
};

/**
 * Declared once, in a module both the Server Component and the Client Component import: a list
 * holds functions, so it cannot travel between them as a prop. Its API is the app's own
 * `/api/articles`, at the address the tests serve the app from.
 */
export const articleList = defineList({
  apply: (builder, { q, sort }) => {
    builder.setLimit(10);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (q) {
      builder.addFilter('title', q);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title'] as const,
    }),
  },
  qubee: { baseUrl: 'http://127.0.0.1:3210/api', driver: STRAPI_DRIVER },
  resource: 'articles',
});
