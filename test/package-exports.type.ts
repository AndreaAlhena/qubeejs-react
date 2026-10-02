/**
 * The `exports` field of package.json: a subpath, then `import` / `require`, then the conditions.
 */
export type PackageExports = Record<string, Record<string, Record<string, string>>>;
