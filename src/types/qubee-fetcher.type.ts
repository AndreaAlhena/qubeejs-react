/**
 * The function the fetching APIs call to perform a request. It has the shape of `fetch`, so the
 * global `fetch` fits, and so does a wrapper that adds an `Authorization` header or a client
 * such as `ky`.
 *
 * It receives the request's address, the headers the driver wants on it, and the signal that
 * aborts it. A response whose status is not `ok` becomes a {@link QubeeFetchError}.
 *
 * @example
 * ```ts
 * const authFetch: QubeeFetcher = (uri, init) =>
 *   fetch(uri, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token()}` } });
 * ```
 */
export type QubeeFetcher = (
  uri: string,
  init: { headers: Record<string, string>; signal?: AbortSignal }
) => Promise<Response>;
