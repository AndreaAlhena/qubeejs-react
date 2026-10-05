import { defineList, integerParam, STRAPI_DRIVER } from '@qubeejs/core';

/** A list whose request needs the project id besides URL state: its input. */
export const taskList = defineList({
  qubee: { baseUrl: 'https://example.com/api', driver: STRAPI_DRIVER },
  resource: 'tasks',
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
  },
  apply: (builder, _state, { projectId }: { projectId: string }) => {
    builder.addFilter('project', projectId);
  },
});
