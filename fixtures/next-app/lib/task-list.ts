import { defineList, enumParam, integerParam, STRAPI_DRIVER } from '@qubeejs/core';

/** A task as the app's stand-in API returns it. */
export type Task = {
  id: number;
  project: string;
  status: 'done' | 'open';
  title: string;
};

/**
 * The tasks of one project. The project comes from the route path, `/projects/[id]/tasks`, not
 * from the query, so it is the list's input: the Server Component and the Client Component both
 * pass it, and the URL keeps only the page and the status.
 */
export const taskList = defineList({
  apply: (builder, { status }, { projectId }: { projectId: string }) => {
    builder.setLimit(5);
    builder.addFilter('project', projectId);

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    status: enumParam('status', ['done', 'open'] as const),
  },
  qubee: { baseUrl: 'http://127.0.0.1:3210/api', driver: STRAPI_DRIVER },
  resource: 'tasks',
});
