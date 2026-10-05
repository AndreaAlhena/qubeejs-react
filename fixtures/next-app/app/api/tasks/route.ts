import { tasks } from '../../../lib/tasks';

/**
 * A stand-in for a Strapi API, served by the app itself: it filters the tasks by project and
 * status and pages them the way the list's requests ask, and answers in Strapi's shape.
 */
export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('pagination[page]') ?? 1);
  const pageSize = Number(searchParams.get('pagination[pageSize]') ?? 5);
  const project = searchParams.get('filters[project][$eq]');
  const status = searchParams.get('filters[status][$eq]');
  const rows = tasks.filter(
    (task) => task.project === project && (status === null || task.status === status)
  );

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
