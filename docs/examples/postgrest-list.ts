import {
  defineList,
  integerParam,
  PaginationModeEnum,
  POSTGREST_DRIVER,
  SortEnum,
  sortParam,
} from '@qubeejs/core';

/**
 * Articles from a PostgREST API that pages with Range headers instead of
 * limit and offset parameters.
 */
export const postgrestArticleList = defineList({
  qubee: {
    baseUrl: 'https://example.com/rest/v1',
    driver: POSTGREST_DRIVER,
    pagination: PaginationModeEnum.RANGE,
  },
  resource: 'articles',
  params: {
    sort: sortParam('sort', {
      default: [{ field: 'published_at', order: SortEnum.DESC }],
      fields: ['published_at', 'title'],
    }),
    page: integerParam('page', { default: 1, min: 1 }),
  },
  apply: (builder, { sort }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));
  },
});
