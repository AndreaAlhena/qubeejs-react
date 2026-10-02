/**
 * Test the package the way an app gets it: packed, installed from the tarball into a fresh
 * project outside the repository, type-checked and run.
 *
 * The project is consumer/. It is copied to a temporary directory, so nothing resolves to the
 * repository's own node_modules or source. Checked there:
 * - strict types under `bundler` and `node16` module resolution;
 * - server rendering in plain Node, with no `window`;
 * - a browser-like run in jsdom, with and without StrictMode;
 * - all of it as ESM and as CommonJS;
 * - that a bundler which knows nothing of `'use client'` still bundles the package;
 * - that no entry reads `process` once bundled for production (consumer/production-check.mjs).
 *
 * Every entry of entries.json must be imported by consumer/src/type-checks.tsx: an entry the
 * consumer project never touches would pass all of the above untested.
 *
 * `CONSUMER_REACT=18` runs it on React 18.3; the default is React 19.
 * Run it after `npm run build`.
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const react = process.env.CONSUMER_REACT ?? '19';

/** Run a command, streaming its output; a non-zero exit throws. */
function run(command, cwd, env = {}) {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
}

if (!existsSync(join(root, 'dist', 'index.js'))) {
  console.error('test-consumer: dist/ is missing — run `npm run build` first.');
  process.exit(1);
}

const typeChecks = readFileSync(join(root, 'consumer', 'src', 'type-checks.tsx'), 'utf8');
const untested = JSON.parse(readFileSync(join(root, 'entries.json'), 'utf8'))
  .map(({ subpath }) => `@qubeejs/react${subpath.slice(1)}`)
  .filter((specifier) => !typeChecks.includes(`from '${specifier}'`));

if (untested.length) {
  console.error(
    `test-consumer: consumer/src/type-checks.tsx imports nothing from ${untested.join(', ')} — every entry of entries.json must be exercised there.`
  );
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'qubeejs-react-consumer-'));
const project = join(work, 'consumer');

try {
  run(`npm pack --pack-destination "${work}"`, root);

  const tarball = readdirSync(work).find((name) => name.endsWith('.tgz'));

  renameSync(join(work, tarball), join(work, 'qubeejs-react.tgz'));
  cpSync(join(root, 'consumer'), project, { recursive: true });

  run('npm install --no-audit --no-fund', project);

  if (react === '18') {
    run(
      'npm install --no-audit --no-fund react@18.3 react-dom@18.3 @types/react@18 @types/react-dom@18',
      project
    );
  }

  run('npx tsc -p tsconfig.json', project);
  run('npx tsc -p tsconfig.node16.json', project);

  for (const test of ['ssr-test', 'client-test']) {
    for (const [format, extension] of [
      ['esm', 'mjs'],
      ['cjs', 'cjs'],
    ]) {
      run(
        `npx esbuild src/${test}.tsx --bundle --packages=external --platform=node --format=${format} --jsx=automatic --outfile=out/${test}.${extension} --log-level=warning`,
        project
      );
    }
  }

  for (const extension of ['mjs', 'cjs']) {
    run(`node out/ssr-test.${extension}`, project);
    run(`node out/client-test.${extension}`, project);
    run(`node out/client-test.${extension}`, project, { STRICT: '1' });
  }

  // An app's bundler inlines the package. The client directive must not stop it.
  run(
    'npx esbuild src/app.tsx --bundle --format=esm --jsx=automatic --outfile=out/bundled.js --log-level=error',
    project
  );

  run('node production-check.mjs', project);

  console.log(`\ntest-consumer: ok (React ${react})`);
} finally {
  rmSync(work, { force: true, recursive: true });
}
