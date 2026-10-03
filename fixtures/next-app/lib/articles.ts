import type { Article } from './article-list';

/** How many articles the stand-in API holds: three pages of ten, the last one half full. */
const ARTICLE_COUNT = 25;

/** The day the newest article was published; each next one is a day older. */
const NEWEST = Date.UTC(2026, 8, 30);

const DAY_MS = 86_400_000;

/**
 * The articles behind `/api/articles`, newest first: "Article 01" is the newest, so the list's
 * default sort and a sort by title give the same order, and a page is easy to recognise.
 */
export const articles: readonly Article[] = Array.from({ length: ARTICLE_COUNT }, (_, index) => ({
  id: index + 1,
  publishedAt: new Date(NEWEST - index * DAY_MS).toISOString(),
  title: `Article ${String(index + 1).padStart(2, '0')}`,
}));
