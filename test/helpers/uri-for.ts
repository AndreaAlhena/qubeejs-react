import { buildListRequest, readListState } from '@qubeejs/core';

import { articleList } from '../fixtures/article-list';

/**
 * The request URI the articles list builds for a query string.
 *
 * @param search - The query without `?`, e.g. `q=react`
 * @returns The `uri` of the list's request for the state read from `search`
 */
export const uriFor = (search: string): string =>
  buildListRequest(articleList, readListState(articleList, search)).uri;
