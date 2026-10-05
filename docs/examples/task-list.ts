import { defineList, enumParam, integerParam, STRAPI_DRIVER } from '@qubeejs/core';

import { API_URL } from './article-list';

/** A task as the Strapi API returns it. */
export type Task = {
  id: number;
  status: 'done' | 'open';
  title: string;
};

/**
 * The tasks of one project. The project is not in the query — it comes from the route path,
 * /projects/42/tasks — so the list declares it as its input, by annotating the third parameter
 * of `apply`.
 */
export const taskList = defineList({
  apply: (builder, { status }, { projectId }: { projectId: string }) => {
    builder.addFilter('project', projectId);

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    status: enumParam('status', ['done', 'open'] as const),
  },
  qubee: { baseUrl: API_URL, driver: STRAPI_DRIVER },
  resource: 'tasks',
});
