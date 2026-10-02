/**
 * Whether the app was built for production, as bundlers define `process.env.NODE_ENV`.
 *
 * Without a bundler there is no `process` in a browser; that counts as development.
 *
 * @returns `true` in a production build
 */
export function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env['NODE_ENV'] === 'production';
}
