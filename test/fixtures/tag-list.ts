import { defineList, integerParam, STRAPI_DRIVER, stringParam } from '@qubeejs/core';

/**
 * A list with no sortParam, for the specs that check `toggleSort` is absent.
 */
export const tagList = defineList({
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
  },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'tags',
});
