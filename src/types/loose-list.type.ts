import type { ListDefinition, ListParams } from '@qubeejs/core';

/**
 * {@link useListState}'s non-generic view of a list. See the cast at the top of the hook.
 */
export type LooseList = ListDefinition<ListParams>;
