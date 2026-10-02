/**
 * Check the built site before it ships.
 *
 * - Every internal href and src resolves to a file in dist/.
 * - No link is a bare `href="#"`, the mockup's placeholder link.
 * - None of the mockup's placeholder API or copy made it into a page.
 * - dist/ holds a CNAME for the right domain.
 * - Links into the core docs name pages that exist there, when a checkout of
 *   qubeejs-core sits next to this repository (it does in CI).
 *
 * With `--pending`, a dead link to a page this site will have (PLANNED) is
 * reported but does not fail: the pages land one task at a time. Every other
 * dead link fails either way, so a typo never waits for the last page.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const coreDocs = join(here, '..', '..', '..', 'qubeejs-core', 'docs', 'src', 'content', 'docs');
const pending = process.argv.includes('--pending');

const SITE = 'https://qubeejs-react.andreatantimonaco.me';
const CORE = 'https://qubeejs.andreatantimonaco.me';
const DOMAIN = 'qubeejs-react.andreatantimonaco.me';

/** Every page of the finished site, by slug ('' is the home page). */
const PLANNED = new Set([
  '',
  'api/fetch',
  'api/fetch/fetch-qubee-page',
  'api/main',
  'api/main/adapter-navigate-options',
  'api/main/adapter-provider-props',
  'api/main/browser-adapter',
  'api/main/create-adapter-provider',
  'api/main/list-set-options',
  'api/main/memory-adapter',
  'api/main/memory-adapter-props',
  'api/main/missing-qubee-provider-error',
  'api/main/missing-router-adapter-error',
  'api/main/qubee-fetch-error',
  'api/main/qubee-fetch-provider',
  'api/main/qubee-fetch-provider-props',
  'api/main/qubee-fetcher',
  'api/main/qubee-handle',
  'api/main/qubee-list-handle',
  'api/main/qubee-provider',
  'api/main/qubee-provider-props',
  'api/main/qubee-query-options',
  'api/main/qubee-query-result',
  'api/main/router-adapter',
  'api/main/sort-toggle',
  'api/main/use-browser-adapter',
  'api/main/use-memory-adapter',
  'api/main/use-qubee',
  'api/main/use-qubee-context',
  'api/main/use-qubee-list',
  'api/main/use-qubee-query',
  'api/next',
  'api/next/next-adapter',
  'api/next/next-adapter-options',
  'api/next/next-adapter-props',
  'api/next/use-next-adapter',
  'api/react-router',
  'api/react-router/react-router-adapter',
  'api/react-router/react-router-adapter-options',
  'api/react-router/react-router-adapter-props',
  'api/react-router/use-react-router-adapter',
  'api/swr',
  'api/swr/qubee-swr-options',
  'api/swr/use-qubee-swr',
  'api/tanstack-query',
  'api/tanstack-query/qubee-query-key',
  'api/tanstack-query/qubee-query-options',
  'api/tanstack-router',
  'api/tanstack-router/tanstack-router-adapter',
  'api/tanstack-router/tanstack-router-adapter-options',
  'api/tanstack-router/tanstack-router-adapter-props',
  'api/tanstack-router/use-tanstack-router-adapter',
  'changelog',
  'guide/adapters',
  'guide/fetching',
  'guide/in-memory-lists',
  'guide/provider',
  'guide/re-renders',
  'guide/search-debounce',
  'guide/server-rendering',
  'guide/sorting-pagination',
  'guide/testing',
  'guide/url-lists',
  'guide/use-qubee',
  'introduction/frameworks',
  'introduction/installation',
  'introduction/quick-start',
  'introduction/why-an-adapter',
  'recipes/debounced-search',
  'recipes/pagination-bar',
  'recipes/react-router',
  'recipes/sortable-table',
  'recipes/swr',
  'recipes/tanstack-query',
  'recipes/tanstack-router',
  'recipes/testing-with-msw',
]);

/** Core pages its build generates, so a source checkout does not have them. */
const CORE_GENERATED = [/^api\//, /^changelog$/, /^drivers\/(capabilities|reference\/.+)$/];

/** The mockup's placeholder API and copy. */
const FORBIDDEN = [
  /useQubeeInfinite/,
  /useQubeeConfig/,
  /createFetchTransport/,
  /createAxiosTransport/,
  /\btransports?\b/i,
  /0\.1\.0-rc\.1/,
];

const errors = [];
const warnings = [];
let coreChecked = 0;

if (!existsSync(dist)) {
  console.error('check-site: dist/ is missing — run `npm run build` in docs/ first.');
  process.exit(1);
}

/** Whether a site path resolves to a built file. */
function resolves(path) {
  const target = join(dist, path);

  if (path.endsWith('/')) {
    return existsSync(join(target, 'index.html'));
  }

  return existsSync(target) || existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
}

/** Check a link into the core docs against a local checkout of them. */
function checkCore(file, url) {
  const slug = url.pathname.replace(/^\/|\/$/g, '');

  if (!slug || CORE_GENERATED.some((pattern) => pattern.test(slug)) || !existsSync(coreDocs)) {
    return;
  }

  coreChecked += 1;

  const found = ['.mdx', '.md', '/index.mdx', '/index.md'].some((suffix) =>
    existsSync(join(coreDocs, `${slug}${suffix}`))
  );

  if (!found) {
    errors.push(`${file}: the core docs have no page ${url.pathname}`);
  }
}

const pages = readdirSync(dist, { recursive: true })
  .map((file) => String(file).replaceAll('\\', '/'))
  .filter((file) => file.endsWith('.html'));

for (const file of pages) {
  const html = readFileSync(join(dist, file), 'utf8');
  const pageUrl = new URL(`/${file.replace(/(^|\/)index\.html$/, '$1')}`, SITE);

  for (const [, attribute, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (attribute === 'href' && raw === '#') {
      errors.push(`${file}: bare href="#"`);
      continue;
    }

    const url = new URL(raw.replaceAll('&amp;', '&'), pageUrl);

    if (url.origin === CORE) {
      checkCore(file, url);
      continue;
    }

    if (url.origin !== SITE) {
      continue;
    }

    const path = decodeURIComponent(url.pathname);

    if (resolves(path)) {
      continue;
    }

    const slug = path.replace(/^\/|\/$/g, '');
    (pending && PLANNED.has(slug) ? warnings : errors).push(`${file}: dead link ${path}`);
  }

  const text = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');

  for (const pattern of FORBIDDEN) {
    if (pattern.test(text)) {
      errors.push(`${file}: the mockup's placeholder ${pattern} is in the page`);
    }
  }
}

const cname = existsSync(join(dist, 'CNAME')) ? readFileSync(join(dist, 'CNAME'), 'utf8').trim() : '';

if (cname !== DOMAIN) {
  errors.push(`dist/CNAME is "${cname}", expected "${DOMAIN}"`);
}

for (const warning of [...new Set(warnings)]) {
  console.warn(`  pending  ${warning}`);
}

for (const error of [...new Set(errors)]) {
  console.error(`  error    ${error}`);
}

console.log(
  `check-site: ${pages.length} pages, ${errors.length} errors, ${warnings.length} pending links, ` +
    (existsSync(coreDocs) ? `${coreChecked} core links checked` : 'core links not checked (no ../qubeejs-core)')
);

process.exit(errors.length ? 1 : 0);
