import { articles } from '../../../lib/articles';

/**
 * A stand-in for a Strapi API, served by the app itself: it filters, sorts and pages the
 * articles the way the list's requests ask, and answers in Strapi's shape.
 */
export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('pagination[page]') ?? 1);
  const pageSize = Number(searchParams.get('pagination[pageSize]') ?? 10);
  const title = searchParams.get('filters[title][$eq]');
  const [field, order] = (searchParams.get('sort[0]') ?? 'publishedAt:desc').split(':');
  const key = field === 'title' ? 'title' : 'publishedAt';
  const direction = order === 'asc' ? 1 : -1;
  const rows = articles
    .filter((article) => title === null || article.title === title)
    .toSorted((a, b) => direction * a[key].localeCompare(b[key]));

  return Response.json({
    data: rows.slice((page - 1) * pageSize, page * pageSize),
    meta: {
      pagination: {
        page,
        pageCount: Math.ceil(rows.length / pageSize),
        pageSize,
        total: rows.length,
      },
    },
  });
}
