import { createRoute, createRouter } from '@tanstack/react-router';

import { ArticlesPage } from './tanstack-router-articles';
import { rootRoute } from './tanstack-router-root';
import { parseSearch, stringifySearch } from './tanstack-router-search';

const articlesRoute = createRoute({
  component: ArticlesPage,
  getParentRoute: () => rootRoute,
  path: '/articles',
});

/**
 * The router. The two serialisers keep the query as plain text, so a search box
 * keeps what was typed.
 */
export const router = createRouter({
  parseSearch,
  routeTree: rootRoute.addChildren([articlesRoute]),
  stringifySearch,
});
