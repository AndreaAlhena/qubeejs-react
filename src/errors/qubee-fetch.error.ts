/**
 * Thrown by {@link fetchQubeePage} — and reported by the hooks built on it — when the API
 * answers with a status that is not `ok`.
 *
 * It carries the response, so the caller can read the body the API sent with the failure. It
 * extends `Error` rather than core's `QubeeError`, whose `code` is a closed union owned by
 * `@qubeejs/core`. `Object.setPrototypeOf` keeps `instanceof` working when a consumer's
 * toolchain downlevels classes below ES2015.
 *
 * @example
 * ```ts
 * if (error instanceof QubeeFetchError && error.status === 401) {
 *   redirectToLogin();
 * }
 * ```
 */
export class QubeeFetchError extends Error {
  /** The response as the fetcher returned it; its body has not been read. */
  public readonly response: Response;

  /** The HTTP status of the response, e.g. `404`. */
  public readonly status: number;

  /** The address that was requested. */
  public readonly uri: string;

  /**
   * Build the error for a response that is not `ok`.
   *
   * @param uri - The address that was requested
   * @param response - The response the fetcher returned
   */
  constructor(uri: string, response: Response) {
    super(`The request to ${uri} failed with status ${response.status}.`);

    this.name = new.target.name;
    this.response = response;
    this.status = response.status;
    this.uri = uri;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
