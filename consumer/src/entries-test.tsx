// The other entry points, loaded the way an app loads them, working with the main entry.
import type { ReactElement } from 'react';

import { buildListRequest, readListState } from '@qubeejs/core';
import { QubeeFetchError, useQubeeList } from '@qubeejs/react';
import * as fetchEntry from '@qubeejs/react/fetch';
import * as next from '@qubeejs/react/next';
import { ReactRouterAdapter, useReactRouterAdapter } from '@qubeejs/react/react-router';
import * as tanstackQuery from '@qubeejs/react/tanstack-query';
import * as tanstackRouter from '@qubeejs/react/tanstack-router';
import { QueryClient } from '@tanstack/react-query';
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

check(
  'the next entry exports its provider and its hook',
  typeof next.NextAdapter === 'function' && typeof next.useNextAdapter === 'function',
  Object.keys(next)
);

/** The fetch entry, called outside React with a fetcher that answers like a Strapi API. */
async function fetching(): Promise<void> {
  const request = buildListRequest(articleList, readListState(articleList, 'page=2'));
  const body = {
    data: [
      { id: 1, title: 'Hooks in depth' },
      { id: 2, title: 'Server rendering' },
    ],
    meta: { pagination: { page: 2, pageCount: 3, pageSize: 20, total: 57 } },
  };
  const asked: string[] = [];
  const page = await fetchEntry.fetchQubeePage<{ id: number; title: string }>(request, {
    fetcher: (uri) => {
      asked.push(uri);

      return Promise.resolve(new Response(JSON.stringify(body)));
    },
  });

  check(
    'fetchQubeePage asks the fetcher for the request and returns the page as a plain object',
    asked.length === 1 &&
      asked[0] === request.uri &&
      page.data.length === 2 &&
      page.lastPage === 3 &&
      Object.getPrototypeOf(page) === Object.prototype,
    { asked, page }
  );

  const failure: unknown = await fetchEntry
    .fetchQubeePage(request, {
      fetcher: () => Promise.resolve(new Response(null, { status: 503 })),
    })
    .catch((reason: unknown) => reason);

  // Two entries, one class: an `instanceof` against the main entry's export must hold for an
  // error thrown by the fetch entry.
  check(
    'a failed response is the QubeeFetchError the main entry exports',
    fetchEntry.QubeeFetchError === QubeeFetchError &&
      failure instanceof QubeeFetchError &&
      failure.status === 503,
    String(failure)
  );

  // The TanStack Query entry, used outside React the way a loader prefetches a page.
  const client = new QueryClient();
  const options = tanstackQuery.qubeeQueryOptions<{ id: number; title: string }>(request, {
    fetcher: () => Promise.resolve(new Response(JSON.stringify(body))),
  });
  const cached = await client.fetchQuery(options);

  check(
    'qubeeQueryOptions fetches the page through a QueryClient, under the key of the request',
    cached.lastPage === 3 &&
      client.getQueryData(['qubee', request.uri, request.headers]) === cached &&
      client.getQueryData(options.queryKey) === cached,
    cached
  );

  client.clear();
}

void fetching().then(() => finish(`Entries (React ${version})`));
