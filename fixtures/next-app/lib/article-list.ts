import {
  defineList,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

/**
 * Declared once, in a module both the Server Component and the Client Component import: a list
 * holds functions, so it cannot travel between them as a prop.
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
  qubee: { baseUrl: 'https://example.com/api', driver: STRAPI_DRIVER },
  resource: 'articles',
});
