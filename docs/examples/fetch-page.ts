import type { ListRequest, PaginatedObject, PaginatedResult, RawResponse } from '@qubeejs/core';

/**
 * Fetch one page of a list and parse it with the driver that built the request.
 *
 * Takes the whole request: its `headers` carry the page for header-paginated
 * drivers, and its `paginate` belongs to the same qubee instance as its `uri`.
 * Returns a plain object, which can be cached, compared and handed from a
 * Server Component to a Client Component.
 */
export async function fetchPage<T extends PaginatedObject>(
  request: ListRequest,
  signal?: AbortSignal
): Promise<PaginatedResult<T>> {
  const response = await fetch(request.uri, { headers: request.headers ?? {}, signal });

  if (!response.ok) {
    throw new Error(`GET ${request.uri} answered ${response.status}`);
  }

  const body = (await response.json()) as RawResponse;

  return request.paginate<T>(body, response.headers).toPlain();
}
