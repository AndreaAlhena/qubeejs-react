/**
 * Turn the adapter's JSDoc into API reference pages.
 *
 * Ported from qubeejs-core's docs/scripts/generate-api.mjs. What differs:
 *
 * - the pages are grouped by entry point, as entries.json lists them: one
 *   folder per entry, with an overview page that says what to import it from,
 *   what it needs, and what it exports;
 * - an export that two entries share gets one page, under the main entry, and
 *   is listed in the overview of both;
 * - every page carries a `kind` (hook, component, function, type, error) that
 *   the PageTitle override shows as a badge beside the title, and an export
 *   that fits no kind fails the build;
 * - type aliases list their members, variant by variant for a union;
 * - prose from JSDoc is escaped for MDX, so `<QubeeProvider>` in a comment
 *   reads as text rather than as an unknown JSX tag;
 * - TypeDoc runs from docs/node_modules, so the library needs no TypeDoc of
 *   its own.
 *
 * Every page here is generated — never hand-edit src/content/docs/api/.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mdx } from './mdx.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const outDir = join(here, '..', 'src', 'content', 'docs', 'api');
const jsonPath = join(here, '..', '.typedoc.json');
const typedocBin = join(here, '..', 'node_modules', 'typedoc', 'bin', 'typedoc');
const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));

/**
 * The entry points, the main one first: TypeDoc documents an export under the
 * first entry that has it, so one that several entries share lands in the main.
 */
const ENTRIES = JSON.parse(readFileSync(join(repo, 'entries.json'), 'utf8')).sort(
  (a, b) => Number(b.name === 'index') - Number(a.name === 'index') || a.name.localeCompare(b.name)
);

/** TypeDoc's ReflectionKind values this script reads. */
const REFLECTION = {
  CLASS: 128,
  CONSTRUCTOR: 512,
  FUNCTION: 64,
  METHOD: 2048,
  MODULE: 2,
  PROPERTY: 1024,
  REFERENCE: 4194304,
  TYPE_ALIAS: 2097152,
  VARIABLE: 32,
};

/** The order of the kinds within an entry's sidebar group, and their plural names. */
const KINDS = {
  component: { plural: 'components', rank: 1 },
  error: { plural: 'errors', rank: 5 },
  function: { plural: 'functions', rank: 3 },
  hook: { plural: 'hooks', rank: 2 },
  type: { plural: 'types', rank: 4 },
};

/** Room for the pages of one kind in the sidebar order. */
const RANK_STEP = 1000;

/** Stop with a message that names the command which fixes it. */
function fail(message) {
  console.error(`generate-api: ${message}`);
  process.exit(1);
}

// ---- entries ----------------------------------------------------------------

/** The folder of an entry's pages under api/: `main`, `fetch`, `react-router`. */
const dirOf = (entry) => (entry.name === 'index' ? 'main' : entry.name);

/** What an app imports an entry from: `@qubeejs/react`, `@qubeejs/react/fetch`. */
const specifierOf = (entry) => `${pkg.name}${entry.subpath.slice(1)}`;

/** The name TypeDoc gives an entry's module: its source path, without `src/` and the extension. */
const moduleOf = (entry) => entry.source.replace(/^src\//, '').replace(/\.ts$/, '');

// ---- text ---------------------------------------------------------------

/** A TypeDoc comment part list as markdown; `{@link X}` becomes `X` in code. */
const partsText = (parts = []) =>
  parts
    .map((part) => (part.kind === 'inline-tag' ? `\`${part.text}\`` : part.text))
    .join('')
    .trim();

/** A comment's summary, escaped for MDX. */
const summary = (comment) => mdx(partsText(comment?.summary));

/** The first sentence of a comment's summary, on one line, escaped for MDX. */
const firstSentence = (comment) =>
  mdx(
    partsText(comment?.summary)
      .replace(/\s+/g, ' ')
      .replace(/^(.*?[.:])\s.*$/, '$1')
  );

/** The contents of every block tag with a name, such as every `@throws`. */
const blockTags = (comment, name) =>
  (comment?.blockTags ?? []).filter((tag) => tag.tag === name).map((tag) => partsText(tag.content));

/** Escape a value for a markdown table cell. */
const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

/**
 * `useQubee` → `use-qubee`; `QubeeProvider` → `qubee-provider`. A run of capitals is one word —
 * `QubeeSWROptions` → `qubee-swr-options` — and so is the name TanStack, as in the entry names.
 */
const slugOf = (name) =>
  name
    .replace(/TanStack/g, 'Tanstack')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

/** "1 parameter", "3 members". */
const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;

// ---- types --------------------------------------------------------------

/** One parameter as it reads in a signature. */
const param = (p) =>
  `${p.flags?.isRest ? '...' : ''}${p.name}${p.flags?.isOptional ? '?' : ''}: ${typeName(p.type)}`;

/** A call signature as an arrow type. */
const arrow = (signature) =>
  `(${(signature.parameters ?? []).map(param).join(', ')}) => ${typeName(signature.type)}`;

/** A signature's type parameters, with their constraints. */
const typeParameters = (signature) =>
  signature.typeParameters?.length
    ? `<${signature.typeParameters
        .map((tp) => `${tp.name}${tp.type ? ` extends ${typeName(tp.type)}` : ''}`)
        .join(', ')}>`
    : '';

/** Render a TypeDoc type node as readable TypeScript. */
function typeName(t) {
  if (!t) return 'unknown';

  switch (t.type) {
    case 'intrinsic':
    case 'reference':
      return t.typeArguments?.length
        ? `${t.name}<${t.typeArguments.map(typeName).join(', ')}>`
        : t.name;
    case 'array': {
      const inner = typeName(t.elementType);
      return /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`;
    }
    case 'union':
      return t.types
        .map((u) => (u.type === 'intersection' ? `(${typeName(u)})` : typeName(u)))
        .join(' | ');
    case 'intersection':
      return t.types.map(typeName).join(' & ');
    case 'literal':
      return typeof t.value === 'string' ? `'${t.value}'` : String(t.value);
    case 'reflection': {
      const declaration = t.declaration ?? {};
      if (declaration.signatures?.length) return arrow(declaration.signatures[0]);
      return declaration.children?.length ? '{ … }' : '{}';
    }
    case 'conditional':
      return `${typeName(t.checkType)} extends ${typeName(t.extendsType)} ? ${typeName(t.trueType)} : ${typeName(t.falseType)}`;
    case 'indexedAccess':
      return `${typeName(t.objectType)}[${typeName(t.indexType)}]`;
    case 'inferred':
      return `infer ${t.name}`;
    case 'mapped':
      return `{ [${t.parameter} in ${typeName(t.parameterType)}]: ${typeName(t.templateType)} }`;
    case 'namedTupleMember':
      return `${t.name}: ${typeName(t.element)}`;
    case 'optional':
      return `${typeName(t.elementType)}?`;
    case 'predicate':
      return `${t.name} is ${typeName(t.targetType)}`;
    case 'query':
      return `typeof ${typeName(t.queryType)}`;
    case 'rest':
      return `...${typeName(t.elementType)}`;
    case 'templateLiteral':
      return 'template literal';
    case 'tuple':
      return `[${(t.elements ?? []).map(typeName).join(', ')}]`;
    case 'typeOperator':
      return `${t.operator} ${typeName(t.target)}`;
    default:
      return t.name ?? t.type ?? 'unknown';
  }
}

/** A type alias's type; TypeDoc leaves `type` unset for an object literal and lists its members as children. */
const aliasedType = (node) =>
  node.type ?? { declaration: { children: node.children ?? [] }, type: 'reflection' };

/** The members an object type declares, across the parts of an intersection. */
function membersOf(type) {
  if (!type) return [];
  if (type.type === 'reflection') return type.declaration?.children ?? [];
  if (type.type === 'intersection') return type.types.flatMap(membersOf);
  return [];
}

// ---- exports --------------------------------------------------------------

/** A function's call signatures, whether declared as a function or as a const arrow. */
function signaturesOf(node) {
  if (node.kind === REFLECTION.FUNCTION) return node.signatures ?? [];
  if (node.kind === REFLECTION.VARIABLE) return node.type?.declaration?.signatures ?? [];
  return [];
}

/** What an export is: the badge on its page, and its place in the sidebar. */
function kindOf(node) {
  const isFunction = signaturesOf(node).length > 0;

  if (node.kind === REFLECTION.CLASS && node.name.endsWith('Error')) return 'error';
  if (node.kind === REFLECTION.TYPE_ALIAS) return 'type';
  if (isFunction && /^use[A-Z]/.test(node.name)) return 'hook';
  if (isFunction && /^[A-Z]/.test(node.name)) return 'component';
  if (isFunction) return 'function';

  return fail(
    `export "${node.name}" is no hook, component, function, type or error — teach kindOf() and KINDS about it.`
  );
}

/** How a page names its export: `useQubee()`, `<QubeeProvider>`, `RouterAdapter`. */
const titleOf = (name, kind) =>
  ({ component: `<${name}>`, function: `${name}()`, hook: `${name}()` })[kind] ?? name;

/** Every type name referenced anywhere inside a TypeDoc node. */
function referencedNames(value, found = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => referencedNames(item, found));
    return found;
  }

  if (!value || typeof value !== 'object') return found;
  if (value.type === 'reference' && typeof value.name === 'string') found.add(value.name);

  Object.values(value).forEach((child) => referencedNames(child, found));
  return found;
}

// ---- sections ---------------------------------------------------------------

/** The table of a function's or constructor's parameters. */
function parameterTable(params) {
  if (!params.length) return [];

  return [
    '## Parameters',
    '',
    '| Parameter | Type | Description |',
    '| --- | --- | --- |',
    ...params.map(
      (p) => `| \`${p.name}\` | \`${cell(typeName(p.type))}\` | ${cell(summary(p.comment)) || '—'} |`
    ),
    '',
  ];
}

/** Table rows for the members of an object type or the properties of a class. */
function memberRows(members) {
  return members.map((member) => {
    const signature = member.signatures?.[0] ?? member.type?.declaration?.signatures?.[0];
    const type = member.kind === REFLECTION.METHOD && signature ? arrow(signature) : typeName(member.type);
    const description = summary(member.comment ?? signature?.comment);

    return `| \`${member.name}${member.flags?.isOptional ? '?' : ''}\` | \`${cell(type)}\` | ${cell(description) || '—'} |`;
  });
}

/** An object type's members, after what it inherits from the other parts of an intersection. */
function membersTable(type) {
  const members = membersOf(type);
  const others =
    type?.type === 'intersection'
      ? type.types.filter((part) => part.type !== 'reflection').map(typeName)
      : [];
  const lines = [];

  if (others.length) {
    lines.push(`Everything in ${others.map((name) => `\`${name}\``).join(' and ')}, plus:`, '');
  }

  if (members.length) {
    lines.push('| Member | Type | Description |', '| --- | --- | --- |', ...memberRows(members), '');
  }

  return lines;
}

/** A conditional type's members per branch, following a nested conditional in either branch. */
function conditionalMembers(type) {
  const branch = (part) => (part?.type === 'conditional' ? conditionalMembers(part) : membersTable(part));
  const whenTrue = branch(type.trueType);
  const otherwise = branch(type.falseType);

  return [
    `When \`${typeName(type.checkType)}\` extends \`${typeName(type.extendsType)}\`:`,
    '',
    ...(whenTrue.length ? whenTrue : ['No members.', '']),
    'Otherwise:',
    '',
    ...(otherwise.length ? otherwise : ['No members.', '']),
  ];
}

/** The Members section of a type alias: per variant for a union, per branch for a conditional. */
function renderMembers(type) {
  if (type?.type === 'union') {
    return [
      '## Members',
      '',
      ...type.types.flatMap((variant, index) => [`### Variant ${index + 1}`, '', ...membersTable(variant)]),
    ];
  }

  if (type?.type === 'conditional') {
    return ['## Members', '', ...conditionalMembers(type)];
  }

  const lines = membersTable(type);
  return lines.length ? ['## Members', '', ...lines] : [];
}

/** `@remarks`, as paragraphs. */
const remarks = (comment) =>
  blockTags(comment, '@remarks').flatMap((text) => ['## Remarks', '', mdx(text), '']);

/** `@example` blocks, fenced if the comment did not fence them. */
const examples = (comment) =>
  blockTags(comment, '@example').flatMap((text) => [
    '## Example',
    '',
    text.includes('```') ? text : ['```tsx', text, '```'].join('\n'),
    '',
  ]);

/** `@throws`, as "Bee aware" callouts. */
function throwsAsides(comment) {
  return (comment?.blockTags ?? [])
    .filter((tag) => tag.tag === '@throws')
    .flatMap((tag) => {
      const raw = partsText(tag.content);
      // TypeDoc consumes `{ErrorClass}` as the tag's type, leaving "If the …".
      const body = /^(If|When|Unless)\b/.test(raw)
        ? `Throws ${raw.charAt(0).toLowerCase()}${raw.slice(1)}`
        : raw;

      return [':::caution[Bee aware]', mdx(body).replace(/\.?$/, '.'), ':::', ''];
    });
}

/** Links to the pages of the adapter's other exports this one mentions. */
function seeAlso(node, pages) {
  const links = [...referencedNames(node)]
    .filter((name) => name !== node.name && pages.has(name))
    .sort()
    .map((name) => `[${mdx(pages.get(name).title)}](${pages.get(name).href})`);

  return links.length ? ['## See also', '', links.join(' · '), ''] : [];
}

/** The chips under the title: the source file, from the repository root, and a count. */
function chips(node) {
  const signature = signaturesOf(node)[0];
  const members = membersOf(node.kind === REFLECTION.TYPE_ALIAS ? aliasedType(node) : node.type).length;
  const labels = [
    node.sources?.[0]?.fileName?.replace(/^.*?(?=src\/)/, '') ?? '',
    signature ? count(signature.parameters?.length ?? 0, 'parameter') : '',
    !signature && members ? count(members, 'member') : '',
  ].filter(Boolean);

  return [
    '<div class="qb-chips">',
    ...labels.map((label) => `<span class="qb-chip">${label}</span>`),
    '</div>',
    '',
  ];
}

/** The import line of an export, from each entry that has it. */
function importSection(node, page) {
  const keyword = page.kind === 'type' ? 'import type' : 'import';

  return [
    '## Import',
    '',
    '```ts',
    ...page.entries.map((entry) => `${keyword} { ${node.name} } from '${specifierOf(entry)}';`),
    '```',
    '',
    ...(page.entries.length > 1
      ? ['The entries export the same thing: import it from whichever the file already uses.', '']
      : []),
  ];
}

// ---- pages -----------------------------------------------------------------

/** A hook's, a component's or a function's page. One signature block per overload. */
function renderFunction(node, pages) {
  const signatures = signaturesOf(node);
  const [signature] = signatures;
  const params = signature.parameters ?? [];
  const [returns] = blockTags(signature.comment, '@returns');

  return [
    summary(signature.comment ?? node.comment),
    '',
    ...importSection(node, pages.get(node.name)),
    '## Signature',
    '',
    '```ts',
    ...signatures.map(
      (s) =>
        `function ${node.name}${typeParameters(s)}(${(s.parameters ?? []).map(param).join(', ')}): ${typeName(s.type)}`
    ),
    '```',
    '',
    ...parameterTable(params),
    ...(returns ? ['## Returns', '', mdx(returns), ''] : []),
    ...remarks(signature.comment),
    ...examples(signature.comment),
    ...throwsAsides(signature.comment),
    ...seeAlso(node, pages),
  ];
}

/** A type alias's page. */
function renderType(node, pages) {
  const aliased = aliasedType(node);

  return [
    summary(node.comment),
    '',
    ...importSection(node, pages.get(node.name)),
    '## Definition',
    '',
    '```ts',
    `type ${node.name}${typeParameters(node)} = ${typeName(aliased)}`,
    '```',
    '',
    ...renderMembers(aliased),
    ...remarks(node.comment),
    ...examples(node.comment),
    ...seeAlso(node, pages),
  ];
}

/** An error class's page. */
function renderClass(node, pages) {
  const constructor = (node.children ?? []).find((child) => child.kind === REFLECTION.CONSTRUCTOR);
  const signature = constructor?.signatures?.[0];
  const params = signature?.parameters ?? [];
  const own = (node.children ?? []).filter(
    (child) => child.kind === REFLECTION.PROPERTY && !child.flags?.isPrivate && !child.inheritedFrom
  );
  const parents = (node.extendedTypes ?? []).map(typeName);

  return [
    summary(node.comment),
    '',
    ...(parents.length ? [`Extends ${parents.map((name) => `\`${name}\``).join(', ')}.`, ''] : []),
    ...importSection(node, pages.get(node.name)),
    ...(signature
      ? ['## Constructor', '', '```ts', `new ${node.name}(${params.map(param).join(', ')})`, '```', '']
      : []),
    ...parameterTable(params),
    ...(own.length
      ? ['## Properties', '', '| Property | Type | Description |', '| --- | --- | --- |', ...memberRows(own), '']
      : []),
    ...remarks(node.comment),
    ...examples(node.comment),
    ...seeAlso(node, pages),
  ];
}

/** How each kind of export is rendered. */
const RENDERERS = {
  component: renderFunction,
  error: renderClass,
  function: renderFunction,
  hook: renderFunction,
  type: renderType,
};

/** One export's whole page. */
function renderPage(node, page, order, pages) {
  const description =
    partsText((signaturesOf(node)[0]?.comment ?? node.comment)?.summary).split('\n')[0] ||
    `The ${node.name} ${page.kind}.`;

  return [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(description)}`,
    `kind: ${page.kind}`,
    'editUrl: false',
    'sidebar:',
    `  label: ${JSON.stringify(page.title)}`,
    `  order: ${order}`,
    '---',
    '',
    '{/* Generated from source JSDoc by scripts/generate-api.mjs — do not edit. */}',
    '',
    ...chips(node),
    ...RENDERERS[page.kind](node, pages),
  ].join('\n');
}

/** What an entry needs installed beside the package itself. */
function needs(entry) {
  return entry.peer
    ? `\`${entry.peer}\` \`${pkg.peerDependencies[entry.peer]}\`, an optional peer dependency: install it to use this entry.`
    : 'Nothing beyond the package and its two peers, `react` and `@qubeejs/core`.';
}

/** Where the code of an entry may run. */
const runsIn = (entry) =>
  entry.client
    ? "Client components: the entry is marked `'use client'`. A Server Component can render what it exports, not call it."
    : "Anywhere — a Server Component, a route loader, a script: the entry is not a client module and imports nothing from React.";

/** An entry's overview page: where to import it from, what it needs, what it exports. */
function renderOverview(entry, module, names, pages) {
  const specifier = specifierOf(entry);
  const rows = [...names]
    .sort((a, b) => {
      const [first, second] = [pages.get(a), pages.get(b)];

      return KINDS[first.kind].rank - KINDS[second.kind].rank || a.localeCompare(b);
    })
    .map((name) => {
      const page = pages.get(name);

      return `| [${cell(mdx(page.title))}](${page.href}) | ${page.kind} | ${cell(page.summary) || '—'} |`;
    });

  return [
    '---',
    `title: ${JSON.stringify(specifier)}`,
    `description: ${JSON.stringify(`What ${specifier} exports, and what it needs.`)}`,
    'editUrl: false',
    'sidebar:',
    '  label: "Overview"',
    '  order: 0',
    '---',
    '',
    '{/* Generated from entries.json and source JSDoc by scripts/generate-api.mjs — do not edit. */}',
    '',
    summary(module.comment),
    '',
    '| | |',
    '| --- | --- |',
    `| Import from | \`${specifier}\` |`,
    `| Needs | ${needs(entry)} |`,
    `| Runs in | ${runsIn(entry)} |`,
    '',
    '## Exports',
    '',
    '| Export | Kind | What it is |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

// ---- run -------------------------------------------------------------------

if (!existsSync(typedocBin)) {
  fail('TypeDoc is not installed — run `npm ci` in docs/ first.');
}

if (!existsSync(join(repo, 'node_modules', '@qubeejs', 'core', 'package.json'))) {
  fail('@qubeejs/core is not installed — run `npm ci` at the repository root first.');
}

if (!existsSync(join(repo, 'node_modules', '@qubeejs', 'core', 'dist', 'index.d.ts'))) {
  fail('@qubeejs/core has no build — run `npm ci` at the repository root again.');
}

execFileSync(
  process.execPath,
  [
    typedocBin,
    '--json',
    jsonPath,
    '--entryPoints',
    ...ENTRIES.map((entry) => entry.source),
    '--tsconfig',
    'tsconfig.json',
    '--excludeInternal',
    '--excludePrivate',
    '--logLevel',
    'Error',
  ],
  { cwd: repo, stdio: 'inherit' }
);

// With several entry points TypeDoc nests each one's exports in a module, named after its source.
const modules = new Map(
  (JSON.parse(readFileSync(jsonPath, 'utf8')).children ?? [])
    .filter((child) => child.kind === REFLECTION.MODULE)
    .map((module) => [module.name, module])
);

/** Every export's page: its entry, its address and its title. */
const pages = new Map();

/** The names each entry exports, its own and the ones it shares with an entry before it. */
const exportsOf = new Map();

/** The declaration behind every page. */
const nodes = new Map();

for (const entry of ENTRIES) {
  const module = modules.get(moduleOf(entry));

  if (!module) {
    fail(`TypeDoc reported no module for ${entry.source} — is it in entries.json and on disk?`);
  }

  if (!module.comment) {
    fail(`${entry.source} has no @module comment — its overview page would open with nothing.`);
  }

  exportsOf.set(entry, (module.children ?? []).map((node) => node.name));

  for (const node of module.children ?? []) {
    // An export a second entry shares appears there as a reference to the first declaration.
    if (node.kind === REFLECTION.REFERENCE) {
      pages.get(node.name)?.entries.push(entry);
      continue;
    }

    const kind = kindOf(node);

    if (node.kind === REFLECTION.TYPE_ALIAS && !node.type && !node.children?.length) {
      fail(`type alias "${node.name}" has neither a type nor members — TypeDoc gave the generator nothing to render.`);
    }

    nodes.set(node.name, node);
    pages.set(node.name, {
      dir: dirOf(entry),
      entries: [entry],
      href: `/api/${dirOf(entry)}/${slugOf(node.name)}/`,
      kind,
      summary: firstSentence(signaturesOf(node)[0]?.comment ?? node.comment),
      title: titleOf(node.name, kind),
    });
  }
}

for (const entry of ENTRIES) {
  const missing = exportsOf.get(entry).filter((name) => !pages.has(name));

  if (missing.length) {
    fail(`${entry.source} exports ${missing.join(', ')}, which no page documents.`);
  }

  if (!exportsOf.get(entry).length) {
    fail(`${entry.source} exports nothing, so its sidebar group would be empty.`);
  }
}

rmSync(outDir, { force: true, recursive: true });

for (const entry of ENTRIES) {
  const dir = join(outDir, dirOf(entry));

  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'index.mdx'),
    renderOverview(entry, modules.get(moduleOf(entry)), exportsOf.get(entry), pages)
  );
}

const sorted = [...nodes.values()].sort((a, b) => a.name.localeCompare(b.name));

for (const [index, node] of sorted.entries()) {
  const page = pages.get(node.name);
  const order = KINDS[page.kind].rank * RANK_STEP + index;

  writeFileSync(
    join(outDir, page.dir, `${slugOf(node.name)}.mdx`),
    renderPage(node, page, order, pages)
  );
}

rmSync(jsonPath, { force: true });

console.log(`  generated ${nodes.size} API pages and ${ENTRIES.length} overviews`);
for (const entry of ENTRIES) {
  console.log(`    ${dirOf(entry).padEnd(16)} ${[...exportsOf.get(entry)].sort().join(', ')}`);
}
