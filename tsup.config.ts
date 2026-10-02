import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

import ENTRIES from './entries.json';

const DIRECTIVE = "'use client';";

/**
 * Mark the client entries. esbuild drops module-level directives when it bundles, and tsup's
 * `banner` would also mark the shared chunks, which server-safe entries load. The directive goes
 * on the first line, without a line break, so the source maps keep their line numbers.
 */
function markClientEntries(): void {
  for (const { client, name } of ENTRIES) {
    if (!client) {
      continue;
    }

    for (const extension of ['js', 'cjs']) {
      const file = `dist/${name}.${extension}`;
      const code = readFileSync(file, 'utf8');

      if (!code.startsWith(DIRECTIVE)) {
        writeFileSync(file, `${DIRECTIVE}${code}`);
      }
    }
  }
}

export default defineConfig({
  clean: true,
  dts: true,
  entry: Object.fromEntries(ENTRIES.map(({ name, source }) => [name, source])),
  external: ['@qubeejs/core', 'react', 'react/jsx-runtime'],
  format: ['esm', 'cjs'],
  minify: false,
  onSuccess: async () => {
    markClientEntries();
  },
  sourcemap: true,
  // Shared chunks, in both formats: a provider from one entry and a hook from another must see
  // the same context object.
  splitting: true,
  target: 'es2022',
  treeshake: true,
});
