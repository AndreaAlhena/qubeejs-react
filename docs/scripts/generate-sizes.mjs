/**
 * Measure what @qubeejs/react costs, for the home page's size card and table.
 *
 * Measured, never typed in: esbuild bundles the built package the way an app's
 * bundler would — minified ES2022, React left external — and gzip at level 9
 * gives the transfer size. Two figures, in bytes:
 *
 * - `adapter`: @qubeejs/react alone, @qubeejs/core external — what the adapter
 *   adds over the core;
 * - `withCore`: the adapter, the parts of @qubeejs/core it uses, and one driver
 *   (STRAPI_DRIVER) — what an app ships for its first list.
 */
import { build } from 'esbuild';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const outFile = join(here, '..', 'src', 'data', 'sizes.json');

/** React stays external in both measurements: every app already ships it. */
const REACT = ['react', 'react-dom', 'react/jsx-runtime'];

/** Stop with a message that names the command which fixes it. */
function fail(message) {
  console.error(`generate-sizes: ${message}`);
  process.exit(1);
}

if (!existsSync(join(repo, 'dist', 'index.js'))) {
  fail('dist/index.js is missing — run `npm run build` at the repository root first.');
}

if (!existsSync(join(repo, 'node_modules', '@qubeejs', 'core', 'package.json'))) {
  fail('@qubeejs/core is not installed — run `npm ci` at the repository root first.');
}

/** Bundle `contents`, resolved from the repository root, and measure the output. */
async function measure(contents, external) {
  const result = await build({
    bundle: true,
    external,
    format: 'esm',
    logLevel: 'error',
    minify: true,
    stdin: { contents, loader: 'js', resolveDir: repo },
    target: 'es2022',
    write: false,
  });
  const code = result.outputFiles[0].contents;

  return { gzip: gzipSync(code, { level: constants.Z_BEST_COMPRESSION }).length, min: code.length };
}

const sizes = {
  adapter: await measure("export * from './dist/index.js';", [...REACT, '@qubeejs/core']),
  withCore: await measure(
    "export * from './dist/index.js';\nexport { STRAPI_DRIVER } from '@qubeejs/core';",
    REACT
  ),
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(sizes, null, 2)}\n`);

console.log(`  measured @qubeejs/react: ${sizes.adapter.min} B minified, ${sizes.adapter.gzip} B gzipped`);
console.log(`  measured with @qubeejs/core and STRAPI_DRIVER: ${sizes.withCore.min} B, ${sizes.withCore.gzip} B`);
