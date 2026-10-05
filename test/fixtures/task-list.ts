import { defineList, enumParam, integerParam, sortParam, STRAPI_DRIVER } from '@qubeejs/core';

/**
 * The tasks of one project, the list the input specs run against: a Strapi `tasks` resource with
 * a page, a status filter and a sort, whose request needs the project id besides URL state — its
 * input.
 */
export const taskList = defineList({
  apply: (builder, { sort, status }, { projectId }: { projectId: string }) => {
    builder.addFilter('project', projectId);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    sort: sortParam('sort', { fields: ['due', 'title'] as const }),
    status: enumParam('status', ['done', 'open'] as const),
  },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'tasks',
});
