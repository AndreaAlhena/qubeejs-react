import type { ListInput, ListRequest } from '@qubeejs/core';

/**
 * The `request` of a {@link QubeeListHandle}: a `ListRequest` for a list without an input, and
 * `ListRequest | null` for a list that declares one — `null` while the input passed to
 * {@link useQubeeList} is `null`, that is, not ready yet.
 *
 * A list without an input always has a request, so code that reads it needs no null check.
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListRequest<TList> = [ListInput<TList>] extends [never]
  ? ListRequest
  : ListRequest | null;
