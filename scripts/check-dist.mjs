/**
 * Check the built package before it is tested or published.
 *
 * For every entry in entries.json:
 * - both formats and both declaration files exist;
 * - the `'use client'` directive opens the client entries and appears in no other built file;
 * - both formats load;
 * - what the entry imports from outside the package is `react`, `@qubeejs/core`, or its own
 *   optional peer — nothing else.
 *
 * And for the package: no runtime `dependencies`.
 *
 * Run it after `npm run build`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const require = createRequire(import.meta.url);
const ENTRIES = JSON.parse(readFileSync(join(root, 'entries.json'), 'utf8'));

const DIRECTIVE = "'use client';";
const ALWAYS_ALLOWED = ['@qubeejs/core', 'react', 'react/jsx-runtime'];
const IMPORT = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

const problems = [];

/** Every module a built file loads from outside the package, chunks included. */
function externalsOf(file, seen = new Set()) {
  if (seen.has(file)) {
    return [];
  }

  seen.add(file);

  return [...readFileSync(file, 'utf8').matchAll(IMPORT)].flatMap(([, specifier]) =>
    specifier.startsWith('.') ? externalsOf(join(dirname(file), specifier), seen) : [specifier]
  );
}

if (!existsSync(dist)) {
  console.error('check-dist: dist/ is missing — run `npm run build` first.');
  process.exit(1);
}

const entryFiles = new Set();

for (const { client, name, peer } of ENTRIES) {
  for (const extension of ['js', 'cjs', 'd.ts', 'd.cts']) {
    if (!existsSync(join(dist, `${name}.${extension}`))) {
      problems.push(`dist/${name}.${extension} is missing`);
    }
  }

  for (const extension of ['js', 'cjs']) {
    const file = join(dist, `${name}.${extension}`);

    if (!existsSync(file)) {
      continue;
    }

    entryFiles.add(`${name}.${extension}`);

    const marked = readFileSync(file, 'utf8').startsWith(DIRECTIVE);

    if (client && !marked) {
      problems.push(
        `dist/${name}.${extension} is a client entry without the 'use client' directive`
      );
    }

    if (!client && marked) {
      problems.push(
        `dist/${name}.${extension} is a server-safe entry with the 'use client' directive`
      );
    }

    const allowed = [...ALWAYS_ALLOWED, ...(peer ? [peer] : [])];
    const foreign = [...new Set(externalsOf(file))].filter(
      (specifier) => !allowed.some((name) => specifier === name || specifier.startsWith(`${name}/`))
    );

    if (foreign.length) {
      problems.push(`dist/${name}.${extension} imports ${foreign.join(', ')}`);
    }

    if (!client && externalsOf(file).some((specifier) => specifier.startsWith('react'))) {
      problems.push(`dist/${name}.${extension} is a server-safe entry that imports react`);
    }
  }

  try {
    await import(pathToFileURL(join(dist, `${name}.js`)).href);
  } catch (error) {
    problems.push(`dist/${name}.js does not load: ${error.message}`);
  }

  try {
    require(join(dist, `${name}.cjs`));
  } catch (error) {
    problems.push(`dist/${name}.cjs does not load: ${error.message}`);
  }
}

for (const file of readdirSync(dist).filter((name) => /\.c?js$/.test(name))) {
  if (!entryFiles.has(file) && readFileSync(join(dist, file), 'utf8').includes(DIRECTIVE)) {
    problems.push(`dist/${file} is a shared chunk with the 'use client' directive`);
  }
}

const { dependencies = {} } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

if (Object.keys(dependencies).length) {
  problems.push(`package.json has runtime dependencies: ${Object.keys(dependencies).join(', ')}`);
}

if (problems.length) {
  console.error(
    `check-dist: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join('\n')}`
  );
  process.exit(1);
}

console.log(`check-dist: ${ENTRIES.length} entr${ENTRIES.length === 1 ? 'y' : 'ies'} ok`);
