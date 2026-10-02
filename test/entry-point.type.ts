/**
 * One entry point of the package, as entries.json lists it.
 */
export type EntryPoint = {
  /** The built files start with the `'use client'` directive. */
  client: boolean;
  /** The built file's name, without extension: `dist/<name>.js`. */
  name: string;
  /** The optional peer dependency only this entry's modules may import. */
  peer: null | string;
  /** The source file, from the repository root. */
  source: string;
  /** The key in package.json `exports`: `.` or `./<name>`. */
  subpath: string;
};
