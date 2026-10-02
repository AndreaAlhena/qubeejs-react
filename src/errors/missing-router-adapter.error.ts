/**
 * Thrown by {@link useQubeeList} when it has no router adapter: none was passed as its second
 * argument, and no adapter provider is above the calling component.
 *
 * It extends `Error` rather than core's `QubeeError`, whose `code` is a closed union owned by
 * `@qubeejs/core`. `Object.setPrototypeOf` keeps `instanceof` working when a consumer's
 * toolchain downlevels classes below ES2015.
 *
 * @example
 * ```ts
 * if (error instanceof MissingRouterAdapterError) {
 *   // the adapter provider is missing from this tree
 * }
 * ```
 */
export class MissingRouterAdapterError extends Error {
  /**
   * Build the error with a message that names both ways out.
   */
  constructor() {
    super(
      'useQubeeList() found no router adapter. Wrap the app in an adapter provider — <BrowserAdapter>, <MemoryAdapter>, or the one for your router — or pass an adapter as the second argument.'
    );

    this.name = new.target.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
