import type { ListRequest, SearchParamsInput } from '@qubeejs/core';

import { buildListRequest, readListState } from '@qubeejs/core';

import type { LooseList } from '../types/loose-list.type';
import type { WideList } from '../types/wide-list.type';

/**
 * The request for a list's state at `search`, with the input passed to {@link useQubeeList}.
 *
 * The hook holds its list twice, loose and wide, because the list's own type is generic there.
 * A list with an input never gets `undefined`, and a list without one always does, so the branch
 * on the input is exact and needs no cast.
 *
 * @param loose - The list, as every definition is
 * @param wide - The same list, as one that takes an input
 * @param search - The committed query
 * @param input - The list's input: `undefined` for a list without one, `null` while not ready
 * @returns The request, or `null` while the input is `null`
 */
export function buildRequestFor(
  loose: LooseList,
  wide: WideList,
  search: SearchParamsInput,
  input: NonNullable<unknown> | null | undefined
): ListRequest | null {
  if (input === null) {
    return null;
  }

  const state = readListState(loose, search);

  return input === undefined
    ? buildListRequest(loose, state)
    : buildListRequest(wide, state, input);
}
