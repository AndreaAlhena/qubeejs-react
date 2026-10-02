import type { ListRequest } from '@qubeejs/core';

/**
 * Identify a request by what is sent: its address and its headers.
 *
 * Two request objects for the same page have the same key, whatever their identity and whatever
 * the order of their headers, so a hook that fetches can tell "the same request again" from "a
 * new request".
 *
 * @param request - The request
 * @returns A string that is equal for equal requests
 */
export function requestKey(request: ListRequest): string {
  const headers = Object.entries(request.headers ?? {}).sort(([a], [b]) => (a < b ? -1 : 1));

  return JSON.stringify([request.uri, headers]);
}
