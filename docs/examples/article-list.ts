import {
  defineList,
  enumParam,
  FilterOperatorEnum,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

/** The API every example on this site talks to. */
export const API_URL = 'https://example.com/api';

/** An article's publication status, as the API spells it. */
export enum ArticleStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

/** An article as the Strapi API returns it. */
export type Article = {
  id: number;
  publishedAt: string;
  status: ArticleStatusEnum;
  title: string;
};

/**
 * The article list. Its query is the page URL —
 * `/articles?q=react&status=published&sort=title&page=2` — with the params in
 * the order they are declared.
 */
export const articleList = defineList({
  qubee: { baseUrl: API_URL, driver: STRAPI_DRIVER },
  resource: 'articles',
  params: {
    // Kept exactly as typed (stringParam does not trim), because a search box
    // shows it while the user types. apply() trims it on the way to the API.
    q: stringParam('q'),
    status: enumParam('status', ArticleStatusEnum),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title'],
    }),
    page: integerParam('page', { default: 1, min: 1 }),
  },
  apply: (builder, { q, sort, status }) => {
    const search = q?.trim();

    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (search) {
      builder.addFilterOperator('title', FilterOperatorEnum.ILIKE, search);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
});
