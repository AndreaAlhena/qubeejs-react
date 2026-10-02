/**
 * Bundle every entry of the installed package the way an app's production build does — with
 * `process.env.NODE_ENV` replaced by "production" — and check that nothing in the result still
 * reads `process`.
 *
 * A browser has no `process`. A guard such as `typeof process !== 'undefined'` survives the
 * replacement and is false there, so code meant for development only would run in production.
 */
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const manifest = require.resolve('@qubeejs/react/package.json');
const { exports: entries } = JSON.parse(readFileSync(manifest, 'utf8'));
const failures = [];

for (const [subpath, conditions] of Object.entries(entries)) {
  if (subpath === './package.json') {
    continue;
  }

  const result = await build({
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    entryPoints: [join(dirname(manifest), conditions.import.default)],
    format: 'esm',
    logLevel: 'error',
    packages: 'external',
    write: false,
  });

  if (/\bprocess\b/.test(result.outputFiles[0].text)) {
    failures.push(`"${subpath}" still reads \`process\` in a production bundle`);
  }
}

if (failures.length) {
  console.error(`production-check: ${failures.join('; ')}`);
  process.exit(1);
}

console.log('production-check: no entry reads `process` in a production bundle');
