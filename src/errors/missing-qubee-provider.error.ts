/**
 * Thrown by {@link useQubeeContext} when no {@link QubeeProvider} is above the calling component.
 *
 * It extends `Error` rather than core's `QubeeError`, whose `code` is a closed union owned by
 * `@qubeejs/core`. `Object.setPrototypeOf` keeps `instanceof` working when a consumer's
 * toolchain downlevels classes below ES2015.
 *
 * @example
 * ```ts
 * if (error instanceof MissingQubeeProviderError) {
 *   // render the table without a shared instance
 * }
 * ```
 */
export class MissingQubeeProviderError extends Error {
  /**
   * Build the error with a message that names both ways out.
   */
  constructor() {
    super(
      'useQubeeContext() was called outside a <QubeeProvider>. Wrap the component in a provider, or call useQubee() for an instance of its own.'
    );

    this.name = new.target.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
