import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

const CORE = 'https://qubeejs.andreatantimonaco.me';
const REPO = 'https://github.com/AndreaAlhena/qubeejs-react';

/**
 * The package's entry points, the main one first — the order scripts/generate-api.mjs writes
 * their folders in.
 */
const ENTRIES = JSON.parse(readFileSync(new URL('../entries.json', import.meta.url), 'utf8')).sort(
  (a, b) => Number(b.name === 'index') - Number(a.name === 'index') || a.name.localeCompare(b.name)
);

/** A sidebar link into the core docs, opened in a new tab. */
const core = (label, slug) => ({
  attrs: { rel: 'noopener', target: '_blank' },
  label: `${label} ↗`,
  link: `${CORE}/${slug}/`,
});

/** The sidebar group of one entry point's generated pages. Only the main entry starts open. */
const entry = ({ name }) => ({
  collapsed: name !== 'index',
  items: [{ autogenerate: { directory: `api/${name === 'index' ? 'main' : name}` } }],
  label: name === 'index' ? '@qubeejs/react' : `…/${name}`,
});

export default defineConfig({
  integrations: [
    starlight({
      components: {
        PageTitle: './src/components/PageTitle.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      credits: false,
      customCss: ['./src/styles/qubee-react.css'],
      description:
        'React hooks for @qubeejs/core: a query per component or per subtree, and lists whose query lives in the page URL.',
      // src/pages/404.astro is the site's 404, drawn from the mockup.
      disable404Route: true,
      editLink: { baseUrl: `${REPO}/edit/develop/docs/` },
      // One dark theme for code in both site themes, as the mockup draws it.
      expressiveCode: { themes: ['github-dark-default'] },
      favicon: '/mark-react.png',
      lastUpdated: true,
      sidebar: [
        { items: [{ autogenerate: { directory: 'introduction' } }], label: 'Introduction' },
        { items: [{ autogenerate: { directory: 'setup' } }], label: 'Setup' },
        { items: [{ autogenerate: { directory: 'guide' } }], label: 'Guide' },
        { items: ENTRIES.map(entry), label: 'API' },
        { items: [{ autogenerate: { directory: 'recipes' } }], label: 'Recipes' },
        {
          items: [
            core('Lists & URL state', 'guide/lists'),
            core('Filters & operators', 'guide/filters'),
            core('Building a query', 'guide/building-a-query'),
            core('Drivers', 'drivers'),
            core('QueryBuilder API', 'api/services/query-builder'),
            core('Pagination', 'guide/pagination'),
            core('Errors', 'guide/errors'),
          ],
          label: 'Core docs ↗',
        },
      ],
      social: [{ href: REPO, icon: 'github', label: 'GitHub' }],
      title: 'qubeejs/react',
    }),
  ],
  site: 'https://qubeejs-react.andreatantimonaco.me',
});
