import type { ListRequest } from '@qubeejs/core';

import { useState } from 'react';

import type { LooseList } from '../types/loose-list.type';

import { requestKey } from '../utils/request-key';

/**
 * Whether two requests of one list ask for the same page: both `null`, or the same address and
 * headers. The parser of a request comes from its list, so the two are interchangeable.
 *
 * @param a - A request, or `null`
 * @param b - Another request, or `null`
 * @returns `true` when they ask for the same page
 */
function isSameRequest(a: ListRequest | null, b: ListRequest | null): boolean {
  return a === b || (a !== null && b !== null && requestKey(a) === requestKey(b));
}

/**
 * Keep a list's request object while it asks for the same page.
 *
 * Internal to {@link useQubeeList}. The request is built again whenever the input is a new
 * object, such as `{ projectId }` written in the render; the request of the previous render is
 * returned instead while the list is the same and asks for the same page, so the handle keeps
 * its identity across renders with an equal input.
 *
 * The previous request is kept in state and replaced during render when it changes — React's way
 * of storing information from previous renders. The hook then runs again at once, with the same
 * `built`: one extra run per new request, never one per render.
 *
 * @param list - The list the request belongs to
 * @param built - The request built in this render, or `null`
 * @returns `built`, or an equal request from a previous render
 */
export function useStableRequest(list: LooseList, built: ListRequest | null): ListRequest | null {
  const [kept, setKept] = useState({ list, request: built });
  const isKept = kept.list === list && isSameRequest(kept.request, built);

  if (!isKept) {
    setKept({ list, request: built });
  }

  return isKept ? kept.request : built;
}
