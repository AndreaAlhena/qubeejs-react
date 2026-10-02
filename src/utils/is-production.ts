/**
 * Whether the app was built for production, as bundlers define `process.env.NODE_ENV`.
 *
 * The variable is read with no `typeof process` guard in front of it: a bundler replaces the
 * expression itself, and a guard would be left behind to fail in a browser, which has no
 * `process`. Without a bundler the read throws there; that counts as development.
 *
 * @returns `true` in a production build
 */
export function isProduction(): boolean {
  try {
    return process.env['NODE_ENV'] === 'production';
  } catch {
    return false;
  }
}
