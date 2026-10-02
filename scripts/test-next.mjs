/**
 * Test the Next.js entry against Next.js itself: build the fixture app with the packed tarball,
 * then drive it in a browser.
 *
 * The app is fixtures/next-app. It is copied to a temporary directory and gets the package from
 * its tarball, so nothing resolves to the repository's source. `next build` proves what a unit
 * test cannot: that a Server Component can render `<NextAdapter>` and call `fetchQubeePage`, that
 * the client boundary is in the right place, and that a statically rendered route builds behind
 * a `<Suspense>` boundary. Playwright then loads the production build and types, sorts, pages and
 * goes Back, with the first page fetched on the server and the next ones in the browser.
 *
 * - `NEXT_VERSION=15` builds against that Next.js major; the default is the fixture's own.
 * - `NEXT_BUILD_ONLY=1` stops after `next build`.
 * - `PLAYWRIGHT_CHANNEL=msedge` drives Edge instead of Chrome.
 *
 * Run it after `npm run build`.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.env.NEXT_VERSION;
const buildOnly = process.env.NEXT_BUILD_ONLY === '1';

/** Run a command, streaming its output; a non-zero exit throws. */
function run(command, cwd) {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd, stdio: 'inherit' });
}

if (!existsSync(join(root, 'dist', 'next.js'))) {
  console.error('test-next: dist/next.js is missing — run `npm run build` first.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'qubeejs-react-next-'));
const project = join(work, 'next-app');

try {
  run(`npm pack --pack-destination "${work}"`, root);

  const tarball = readdirSync(work).find((name) => name.endsWith('.tgz'));

  renameSync(join(work, tarball), join(work, 'qubeejs-react.tgz'));
  cpSync(join(root, 'fixtures', 'next-app'), project, { recursive: true });

  run('npm install --no-audit --no-fund', project);

  if (version) {
    run(`npm install --no-audit --no-fund next@${version}`, project);
  }

  run('npx next build', project);

  if (!buildOnly) {
    run('npx playwright test', project);
  }

  console.log(`\ntest-next: ok (Next.js ${version ?? 'as the fixture pins it'})`);
} finally {
  rmSync(work, { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });
}
