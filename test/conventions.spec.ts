// @vitest-environment node
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { EntryPoint } from './entry-point.type';
import type { PackageExports } from './package-exports.type';
import type { SourceDeclaration, SourceFile } from './source-file.type';

import entries from '../entries.json';

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const srcDir = join(rootDir, 'src');
const testDir = join(rootDir, 'test');

const DECL =
  /^(export\s+)?(?:declare\s+)?(abstract class|class|interface|type|enum|const|function)\s+(\w+)/gm;

const SPEC = /\.spec\.tsx?$/;

const COMMENTS = /\/\*[\s\S]*?\*\/|\/\/.*/g;

const IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*['"]([^'"]+)['"]/g;

/** What any entry may import from outside the package, besides its own optional peer. */
const ALWAYS_ALLOWED = ['@qubeejs/core', 'react'];

const read = (dir: string, prefix: string): SourceFile[] =>
  globSync(['**/*.ts', '**/*.tsx'], { cwd: dir }).map((found: string): SourceFile => {
    const p = found.replaceAll('\\', '/');
    const text = readFileSync(join(dir, p), 'utf8');
    const declarations = [...text.matchAll(DECL)].map((m) => ({
      exported: Boolean(m[1]),
      kind: m[2].replace('abstract class', 'class'),
      name: m[3],
    }));
    return { declarations, name: p.split('/').pop() as string, path: `${prefix}${p}`, text };
  });

/** Everything under src/, excluding specs — the shipped library. */
const files: SourceFile[] = read(srcDir, 'src/').filter((f) => !SPEC.test(f.name));

/** Every TypeScript file in the repo, specs and test helpers included. */
const allFiles: SourceFile[] = [...read(srcDir, 'src/'), ...read(testDir, 'test/')];

/** The package's entry points: the build, the dist check and the consumer test read the same list. */
const entryPoints: EntryPoint[] = entries;

const exportedOf = (f: SourceFile): SourceDeclaration[] => f.declarations.filter((d) => d.exported);

const isPackage = (specifier: string, name: string): boolean =>
  specifier === name || specifier.startsWith(`${name}/`);

/** The module specifiers a source file imports, comments aside. */
const importsOf = (f: SourceFile): string[] =>
  [...f.text.replace(COMMENTS, '').matchAll(IMPORT)].map((m) => m[1]);

/** The source file a relative import points at. */
const resolve = (from: SourceFile, specifier: string): SourceFile | undefined => {
  const base = join(from.path, '..', specifier).replaceAll('\\', '/');

  return files.find((f) => f.path === `${base}.ts` || f.path === `${base}.tsx`);
};

/** Every source file an entry reaches through relative imports, itself included. */
const graphOf = (source: string): SourceFile[] => {
  const seen = new Map<string, SourceFile>();
  const visit = (f: SourceFile | undefined): void => {
    if (!f || seen.has(f.path)) return;

    seen.set(f.path, f);
    importsOf(f)
      .filter((specifier) => specifier.startsWith('.'))
      .forEach((specifier) => visit(resolve(f, specifier)));
  };

  visit(files.find((f) => f.path === source));

  return [...seen.values()];
};

const packageJson = (): Record<string, unknown> =>
  JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as Record<string, unknown>;

const packageExports = (): PackageExports => packageJson()['exports'] as PackageExports;

describe('repository conventions', () => {
  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('never mixes declaration kinds in one file', () => {
    const offenders = files
      .filter((f) => new Set(exportedOf(f).map((d) => d.kind)).size > 1)
      .map(
        (f) =>
          `${f.path} exports ${[...new Set(exportedOf(f).map((d) => d.kind))].sort().join(' + ')}`
      );
    expect(offenders).toEqual([]);
  });

  it('declares interfaces only in *.interface.ts', () => {
    const offenders = files
      .filter(
        (f) =>
          f.declarations.some((d) => d.kind === 'interface') && !f.name.endsWith('.interface.ts')
      )
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('exports types only from *.type.ts', () => {
    // File-local (non-exported) helper types may live beside their only consumer.
    const offenders = files
      .filter((f) => exportedOf(f).some((d) => d.kind === 'type') && !f.name.endsWith('.type.ts'))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('reserves the I prefix for interfaces a class implements', () => {
    const all = files.map((f) => f.text).join('\n');
    const offenders = files
      .flatMap((f) => f.declarations.map((d) => ({ ...d, path: f.path })))
      .filter((d) => d.kind === 'interface' || d.kind === 'type')
      .filter((d) => /^I[A-Z]/.test(d.name))
      .filter((d) => !new RegExp(`implements\\s+${d.name}\\b`).test(all))
      .map((d) => `${d.path}: ${d.name} is I-prefixed but no class implements it`);
    expect(offenders).toEqual([]);
  });

  it('names enums *Enum and puts them in *.enum.ts', () => {
    const offenders = allFiles
      .flatMap((f) =>
        f.declarations.filter((d) => d.kind === 'enum').map((d) => ({ ...d, path: f.path }))
      )
      .filter((d) => !d.name.endsWith('Enum') || !d.path.endsWith('.enum.ts'))
      .map((d) => `${d.path}: ${d.name}`);
    expect(offenders).toEqual([]);
  });

  it('uses kebab-case filenames', () => {
    const offenders = allFiles
      .filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z-]+)*\.tsx?$/.test(f.name))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('keeps hooks in hooks/use-*.ts, one per file', () => {
    const offenders = files
      .filter((f) => f.path.startsWith('src/hooks/'))
      .filter((f) => {
        const exported = exportedOf(f);
        return (
          !/^use(-[a-z0-9]+)+\.ts$/.test(f.name) ||
          exported.length !== 1 ||
          exported[0].kind !== 'function' ||
          !/^use[A-Z]/.test(exported[0].name)
        );
      })
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('declares one PascalCase component per .tsx', () => {
    const offenders = files
      .filter((f) => f.name.endsWith('.tsx'))
      .filter((f) => {
        const exported = exportedOf(f);
        return (
          exported.length !== 1 ||
          exported[0].kind !== 'function' ||
          !/^[A-Z]/.test(exported[0].name)
        );
      })
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('depends on no framework but React', () => {
    const offenders = files
      .filter((f) => /@angular|from ['"]rxjs['"]|from ['"]vue['"]/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('writes no client directive in the source', () => {
    // The build adds 'use client' to the client entries of entries.json. A directive in a source
    // file would land in a shared chunk, which the server-safe entries load too.
    const offenders = files
      .filter((f) => /^\s*['"]use client['"]/m.test(f.text.replace(COMMENTS, '')))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('imports an optional peer only from the entry that declares it', () => {
    const offenders = entryPoints.flatMap((entry) => {
      const allowed = [...ALWAYS_ALLOWED, ...(entry.peer ? [entry.peer] : [])];

      return graphOf(entry.source).flatMap((f) =>
        importsOf(f)
          .filter((s) => !s.startsWith('.') && !allowed.some((name) => isPackage(s, name)))
          .map((s) => `${entry.subpath}: ${f.path} imports ${s}`)
      );
    });
    expect(offenders).toEqual([]);
  });

  it('keeps react out of the server-safe entries', () => {
    const offenders = entryPoints
      .filter((entry) => !entry.client)
      .flatMap((entry) =>
        graphOf(entry.source)
          .filter((f) => importsOf(f).some((s) => isPackage(s, 'react')))
          .map((f) => `${entry.subpath}: ${f.path} imports react`)
      );
    expect(offenders).toEqual([]);
  });

  it('keeps each entry in src/index.ts or src/entries/<name>.ts, with named re-exports only', () => {
    const offenders = entryPoints.flatMap((entry) => {
      const expected = entry.name === 'index' ? 'src/index.ts' : `src/entries/${entry.name}.ts`;
      const file = files.find((f) => f.path === entry.source);

      return [
        ...(entry.source === expected ? [] : [`${entry.subpath}: its source is ${entry.source}`]),
        ...(file ? [] : [`${entry.subpath}: ${entry.source} does not exist`]),
        ...(file && /export\s*\*/.test(file.text.replace(COMMENTS, ''))
          ? [`${entry.subpath}: ${entry.source} re-exports with export *`]
          : []),
      ];
    });
    expect(offenders).toEqual([]);
  });

  it('imports nothing from node:', () => {
    // `@types/node` is available project-wide for this very spec; the adapter itself must stay
    // runnable in a browser.
    const offenders = files.filter((f) => /from 'node:/.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('uses UPPER_CASE only for literal constants', () => {
    // UPPER_CASE means a static, literal value. Anything computed at runtime is camelCase.
    const declaration = /^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*(.*)$/gm;
    const literal = /^[{['"`/]|^-?\d|^true\b|^false\b|^null\b/;
    const offenders = allFiles.flatMap((f) =>
      [...f.text.matchAll(declaration)]
        .filter((m) => !literal.test(m[2].trim()))
        .map((m) => `${f.path}: ${m[1]} is computed at runtime — use camelCase`)
    );
    expect(offenders).toEqual([]);
  });

  it('declares types outside *.type.ts only as non-exported local helpers', () => {
    const offenders = allFiles
      .filter((f) => !f.name.endsWith('.type.ts'))
      .flatMap((f) =>
        f.declarations
          .filter((d) => d.kind === 'type' && d.exported)
          .map((d) => `${f.path}: ${d.name}`)
      );
    expect(offenders).toEqual([]);
  });

  it('declares every entry, and nothing else, in package.json exports', () => {
    const exports = packageExports();

    expect(Object.keys(exports).sort()).toEqual(
      [...entryPoints.map((entry) => entry.subpath), './package.json'].sort()
    );

    for (const { name, subpath } of entryPoints) {
      expect(exports[subpath]).toEqual({
        import: { default: `./dist/${name}.js`, types: `./dist/${name}.d.ts` },
        require: { default: `./dist/${name}.cjs`, types: `./dist/${name}.d.cts` },
      });
    }
  });

  it('orders package.json export conditions with types first', () => {
    // Condition order is SEMANTIC — the first match wins. Alphabetical sorting puts "default"
    // before "types", which makes the type declarations unreachable.
    const exports = packageExports();

    for (const { subpath } of entryPoints) {
      const conditions = Object.values(exports[subpath] ?? {});

      expect(conditions.length).toBeGreaterThan(0);
      for (const condition of conditions) {
        expect(Object.keys(condition)[0]).toBe('types');
      }
    }
  });

  it('points package.json main, module and types at the main entry', () => {
    const pkg = packageJson();

    expect([pkg['main'], pkg['module'], pkg['types']]).toEqual([
      './dist/index.cjs',
      './dist/index.js',
      './dist/index.d.ts',
    ]);
  });

  it('performs no network I/O', () => {
    const offenders = files
      .filter((f) => /\b(fetch|XMLHttpRequest|axios)\s*\(/.test(f.text.replace(COMMENTS, '')))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });
});
