import {
  defineList,
  enumParam,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

import { ArticleStatusEnum } from './article-status.enum';

/**
 * The articles list the useListState specs run against: a Strapi `articles` resource with a
 * page, a search, a status filter and a sort.
 */
export const articleList = defineList({
  apply: (builder, { q, sort, status }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (q) {
      builder.addFilter('title', q);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ArticleStatusEnum),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title'] as const,
    }),
  },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'articles',
});
