import type { ListParam } from '@qubeejs/core';

import type { LooseList } from './loose-list.type';

/**
 * One mounted list's claim on a URL name: the list, and the param object it declared.
 *
 * Internal.
 */
export type ParamClaim = {
  /** The list definition that owns the name. */
  list: LooseList;
  /** The param object declared under that name; two lists that share it share the value on purpose. */
  param: ListParam<unknown>;
};
