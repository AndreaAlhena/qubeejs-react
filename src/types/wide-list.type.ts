import type { ListDefinition, ListParams } from '@qubeejs/core';

/**
 * {@link useQubeeList}'s view of a list as one that takes an input. Every definition is one, as
 * every definition is a {@link LooseList}: holding the list both ways lets the hook forward an
 * input without a cast.
 */
export type WideList = ListDefinition<ListParams, NonNullable<unknown>>;
