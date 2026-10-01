import type { ListState } from '@qubeejs/core';

import type { LooseList } from './loose-list.type';

/**
 * Changes to a {@link LooseList}'s state.
 */
export type LooseChanges = Partial<ListState<LooseList>>;
