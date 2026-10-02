// The other entry points, loaded the way an app loads them, working with the main entry.
import type { ReactElement } from 'react';

import { useQubeeList } from '@qubeejs/react';
import { ReactRouterAdapter, useReactRouterAdapter } from '@qubeejs/react/react-router';
import * as tanstackRouter from '@qubeejs/react/tanstack-router';
import { version } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';

import { articleList } from './article-list.js';
import { check, finish } from './report.js';

/** Takes its adapter from the provider: the hook is the main entry's, the provider another's. */
function ProvidedPage(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output>{state.page}</output>;
}

/** Passes the adapter hook's result itself. */
function PassedPage(): ReactElement {
  const { state } = useQubeeList(articleList, useReactRouterAdapter());

  return <output>{state.page}</output>;
}

const provided = renderToString(
  <MemoryRouter initialEntries={['/articles?page=6']}>
    <ReactRouterAdapter>
      <ProvidedPage />
    </ReactRouterAdapter>
  </MemoryRouter>
);

// Two entries, one context: built separately, the provider would put its adapter in a context the
// main entry's hook never reads, and this would throw MissingRouterAdapterError.
check(
  'a provider from the react-router entry reaches a hook from the main entry',
  provided === '<output>6</output>',
  provided
);

const passed = renderToString(
  <MemoryRouter initialEntries={['/articles?page=7']}>
    <PassedPage />
  </MemoryRouter>
);

check('the react-router adapter hook drives a list', passed === '<output>7</output>', passed);

check(
  'the tanstack-router entry exports its provider and its hook',
  typeof tanstackRouter.TanStackRouterAdapter === 'function' &&
    typeof tanstackRouter.useTanStackRouterAdapter === 'function',
  Object.keys(tanstackRouter)
);

finish(`Entries (React ${version})`);
