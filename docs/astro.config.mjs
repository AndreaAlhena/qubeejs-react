import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const CORE = 'https://qubeejs.andreatantimonaco.me';
const REPO = 'https://github.com/AndreaAlhena/qubeejs-react';

/** A sidebar link into the core docs, opened in a new tab. */
const core = (label, slug) => ({
  attrs: { rel: 'noopener', target: '_blank' },
  label: `${label} ↗`,
  link: `${CORE}/${slug}/`,
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
        {
          items: [
            { items: [{ autogenerate: { directory: 'api/provider' } }], label: 'Provider' },
            { items: [{ autogenerate: { directory: 'api/hooks' } }], label: 'Hooks' },
            { items: [{ autogenerate: { directory: 'api/types' } }], label: 'Types' },
            { items: [{ autogenerate: { directory: 'api/errors' } }], label: 'Errors' },
          ],
          label: 'API',
        },
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
