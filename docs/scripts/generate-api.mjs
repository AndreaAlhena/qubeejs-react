/**
 * Turn the adapter's JSDoc into API reference pages.
 *
 * Ported from qubeejs-core's docs/scripts/generate-api.mjs. What differs:
 *
 * - four groups of the adapter's own — provider, hooks, types, errors — and an
 *   export that fits none of them fails the build, instead of landing on a page
 *   no sidebar links to;
 * - every page carries a `kind` (hook, component, type, error) that the
 *   PageTitle override shows as a badge beside the title;
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

/** TypeDoc's ReflectionKind values this script reads. */
const REFLECTION = {
  CLASS: 128,
  CONSTRUCTOR: 512,
  FUNCTION: 64,
  METHOD: 2048,
  PROPERTY: 1024,
  TYPE_ALIAS: 2097152,
  VARIABLE: 32,
};

/** Exports that document the provider, whatever their kind. */
const PROVIDER = new Set(['QubeeProvider', 'QubeeProviderProps', 'useQubeeContext']);

/** The sidebar group of each kind, outside the provider group. */
const GROUP_OF_KIND = { component: 'provider', error: 'errors', hook: 'hooks', type: 'types' };

/** The sidebar groups, each of which must end up with at least one page. */
const GROUPS = ['provider', 'hooks', 'types', 'errors'];

/** Stop with a message that names the command which fixes it. */
function fail(message) {
  console.error(`generate-api: ${message}`);
  process.exit(1);
}

// ---- text ---------------------------------------------------------------

/** A TypeDoc comment part list as markdown; `{@link X}` becomes `X` in code. */
const partsText = (parts = []) =>
  parts
    .map((part) => (part.kind === 'inline-tag' ? `\`${part.text}\`` : part.text))
    .join('')
    .trim();

/** A comment's summary, escaped for MDX. */
const summary = (comment) => mdx(partsText(comment?.summary));

/** The contents of every block tag with a name, such as every `@throws`. */
const blockTags = (comment, name) =>
  (comment?.blockTags ?? []).filter((tag) => tag.tag === name).map((tag) => partsText(tag.content));

/** Escape a value for a markdown table cell. */
const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

/** `useQubee` → `use-qubee`; `QubeeProvider` → `qubee-provider`. */
const slugOf = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

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

/** What an export is: the badge on its page, and the key to its group. */
function kindOf(node) {
  const isFunction = signaturesOf(node).length > 0;

  if (node.kind === REFLECTION.CLASS && node.name.endsWith('Error')) return 'error';
  if (node.kind === REFLECTION.TYPE_ALIAS) return 'type';
  if (isFunction && /^use[A-Z]/.test(node.name)) return 'hook';
  if (isFunction && /^[A-Z]/.test(node.name)) return 'component';

  return fail(
    `export "${node.name}" is no hook, component, type or error — teach kindOf() and GROUP_OF_KIND about it.`
  );
}

/** How a page names its export: `useQubee()`, `<QubeeProvider>`, `ListRouter`. */
const titleOf = (name, kind) => ({ component: `<${name}>`, hook: `${name}()` })[kind] ?? name;

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
  const otherwise = branch(type.falseType);

  return [
    `When \`${typeName(type.checkType)}\` extends \`${typeName(type.extendsType)}\`:`,
    '',
    ...branch(type.trueType),
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

/** The chips under the title: the source file and a count. */
function chips(node) {
  const signature = signaturesOf(node)[0];
  const members = membersOf(node.kind === REFLECTION.TYPE_ALIAS ? aliasedType(node) : node.type).length;
  const labels = [
    node.sources?.[0]?.fileName ?? '',
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

// ---- pages -----------------------------------------------------------------

/** A hook's or a component's page. */
function renderFunction(node, pages) {
  const signature = signaturesOf(node)[0];
  const params = signature.parameters ?? [];
  const [returns] = blockTags(signature.comment, '@returns');

  return [
    summary(signature.comment ?? node.comment),
    '',
    '## Signature',
    '',
    '```ts',
    `function ${node.name}${typeParameters(signature)}(${params.map(param).join(', ')}): ${typeName(signature.type)}`,
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
const RENDERERS = { component: renderFunction, error: renderClass, hook: renderFunction, type: renderType };

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

// ---- run -------------------------------------------------------------------

if (!existsSync(typedocBin)) {
  fail('TypeDoc is not installed — run `npm ci` in docs/ first.');
}

if (!existsSync(join(repo, 'node_modules', '@qubeejs', 'core', 'package.json'))) {
  fail('@qubeejs/core is not installed — run `npm ci` at the repository root first.');
}

if (!existsSync(join(repo, 'node_modules', '@qubeejs', 'core', 'dist', 'index.d.ts'))) {
  fail('@qubeejs/core has no build — run `npm run build` in ../qubeejs-core first.');
}

execFileSync(
  process.execPath,
  [
    typedocBin,
    '--json',
    jsonPath,
    '--entryPoints',
    'src/index.ts',
    '--tsconfig',
    'tsconfig.json',
    '--excludeInternal',
    '--excludePrivate',
    '--logLevel',
    'Error',
  ],
  { cwd: repo, stdio: 'inherit' }
);

const nodes = JSON.parse(readFileSync(jsonPath, 'utf8')).children ?? [];

/** Every export's page: its group, its address and its title. */
const pages = new Map(
  nodes.map((node) => {
    const kind = kindOf(node);

    if (node.kind === REFLECTION.TYPE_ALIAS && !node.type && !node.children?.length) {
      fail(`type alias "${node.name}" has neither a type nor members — TypeDoc gave the generator nothing to render.`);
    }

    const group = PROVIDER.has(node.name) ? 'provider' : GROUP_OF_KIND[kind];

    return [node.name, { group, href: `/api/${group}/${slugOf(node.name)}/`, kind, title: titleOf(node.name, kind) }];
  })
);

for (const group of GROUPS) {
  if (![...pages.values()].some((page) => page.group === group)) {
    fail(`no export lands in the "${group}" group, so its sidebar section would be empty.`);
  }
}

rmSync(outDir, { force: true, recursive: true });

const sorted = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

for (const [order, node] of sorted.entries()) {
  const page = pages.get(node.name);
  const dir = join(outDir, page.group);

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${slugOf(node.name)}.mdx`), renderPage(node, page, order, pages));
}

rmSync(jsonPath, { force: true });

console.log(`  generated ${nodes.length} API pages`);
for (const group of GROUPS) {
  const names = [...pages.entries()].filter(([, page]) => page.group === group).map(([name]) => name);
  console.log(`    ${group.padEnd(10)} ${names.sort().join(', ')}`);
}
