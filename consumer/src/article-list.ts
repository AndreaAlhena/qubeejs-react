// Verbatim from the README ("Lists in the URL"), except the `.js` extension node16 requires.
import { ArticleStatusEnum } from './article-status.enum.js';
import {
  defineList,
  enumParam,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

export const articleList = defineList({
  qubee: { baseUrl: 'https://example.com/api', driver: STRAPI_DRIVER },
  resource: 'articles',
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ArticleStatusEnum),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title'] as const,
    }),
  },
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
});

/** A list with no sortParam: its handle must have no `toggleSort`. */
export const tagList = defineList({
  qubee: { baseUrl: 'https://example.com/api', driver: STRAPI_DRIVER },
  resource: 'tags',
  params: {
    page: integerParam('tagPage', { default: 1, min: 1 }),
  },
  apply: (builder) => {
    builder.setLimit(5);
  },
});
