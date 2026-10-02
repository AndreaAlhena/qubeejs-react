# @qubeejs/react

React hooks for [`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core): lists whose state
lives in the URL of your router, fetched for you, and a query builder per component or per subtree.

[![CI](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**[Documentation](https://qubeejs-react.andreatantimonaco.me)**

Pick your router, wrap the app once, use the hook, fetch. The adapter keeps a list's state in the
URL through your router, re-renders your components when it changes, and fetches the page that
state asks for — with a hook of its own, or through TanStack Query or SWR. Everything
framework-free (drivers, the query builder, list definitions, pagination helpers) is imported from
`@qubeejs/core` and documented there.

## Install

```bash
npm i @qubeejs/react @qubeejs/core
```

React 18.3 or 19. No runtime dependencies.

## Quick start

### 1. Declare the list

Once, with `@qubeejs/core`, as a module-level constant:

```ts
// article-list.ts
import { ArticleStatusEnum } from './article-status.enum';
import {
  defineList,
  enumParam,
  integerParam,
  SortEnum,
  sortParam,
  STRAPI_DRIVER,
  stringParam,
} from '@qubeejs/core';

export const articleList = defineList({
  qubee: { baseUrl: 'https://example.com/api', driver: STRAPI_DRIVER },
  resource: 'articles',
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ArticleStatusEnum),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title'] as const,
    }),
  },
  apply: (builder, { q, sort, status }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (q) {
      builder.addFilter('title', q);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
});
```

### 2. Wrap once

A list reads and writes the URL through your router. Say which one, once, at the root:

| Your app uses      | Wrap it in                | From                             | Needs                                  |
| ------------------ | ------------------------- | -------------------------------- | -------------------------------------- |
| No router library  | `<BrowserAdapter>`        | `@qubeejs/react`                 | —                                      |
| React Router       | `<ReactRouterAdapter>`    | `@qubeejs/react/react-router`    | `react-router` 7 or later              |
| TanStack Router    | `<TanStackRouterAdapter>` | `@qubeejs/react/tanstack-router` | `@tanstack/react-router` 1.49 or later |
| Next.js App Router | `<NextAdapter>`           | `@qubeejs/react/next`            | `next` 15 or later                     |

```tsx
import { BrowserAdapter } from '@qubeejs/react';

<BrowserAdapter>
  <App />
</BrowserAdapter>;
```

The docs have a page for each, ending with a working list page:
[Plain React](https://qubeejs-react.andreatantimonaco.me/setup/plain-react/) ·
[React Router](https://qubeejs-react.andreatantimonaco.me/setup/react-router/) ·
[TanStack Router](https://qubeejs-react.andreatantimonaco.me/setup/tanstack-router/) ·
[Next.js](https://qubeejs-react.andreatantimonaco.me/setup/next/).

### 3. Use the hook, and fetch

```tsx
import { getAriaSort } from '@qubeejs/core';
import { useQubeeList, useQubeeQuery } from '@qubeejs/react';

function Articles(): ReactElement {
  const list = useQubeeList(articleList);
  const articles = useQubeeQuery<Article>(list.request);

  return (
    <section aria-busy={list.isPending || articles.isFetching}>
      <input
        value={list.state.q ?? ''}
        onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })}
      />
      <button onClick={() => list.reset()}>Clear filters</button>
      <th aria-sort={getAriaSort(list.state.sort, 'title')}>
        <button onClick={() => list.toggleSort('title')} type="button">
          Title
        </button>
      </th>
      <ul>
        {articles.data?.data.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      <a href={list.href({ page: 2 })}>2</a>
      <button onClick={() => list.setPage(2)} type="button">
        Go to page 2
      </button>
    </section>
  );
}
```

The component names no router: it is the same in every setup.

## Entry points

| Import from                      | What it holds                                                              | Optional peer                      |
| -------------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `@qubeejs/react`                 | `useQubeeList`, `useQubeeQuery`, `useQubee`, the providers and their types | —                                  |
| `@qubeejs/react/react-router`    | `ReactRouterAdapter`, `useReactRouterAdapter`                              | `react-router` `>=7.0.0`           |
| `@qubeejs/react/tanstack-router` | `TanStackRouterAdapter`, `useTanStackRouterAdapter`                        | `@tanstack/react-router` `^1.49.0` |
| `@qubeejs/react/next`            | `NextAdapter`, `useNextAdapter`                                            | `next` `>=15.0.0`                  |
| `@qubeejs/react/tanstack-query`  | `qubeeQueryOptions`                                                        | `@tanstack/react-query` `^5.62.0`  |
| `@qubeejs/react/swr`             | `useQubeeSWR`                                                              | `swr` `^2.0.0`                     |
| `@qubeejs/react/fetch`           | `fetchQubeePage`, `QubeeFetchError`                                        | —                                  |

You install only what you import. `fetch` and `tanstack-query` are not client modules, so a Server
Component can call what they export; the others are marked `'use client'`. The package ships ES
modules and CommonJS — load it one way throughout an app, because the two are separate copies.

## Lists in the URL: `useQubeeList`

- `state` updates as soon as you call `set()`, so an input never lags behind a debounce or a
  server round-trip.
- `set()` navigates at most once per call. Values equal to their defaults stay out of the URL, a
  change to anything but the page returns to page 1, and parameters the list does not own are
  kept.
- `request` — `{ uri, headers, paginate }` — changes once per navigation, never per keystroke.
- `isPending` is `true` while a debounce waits or a navigation is in flight.
- The URL is the source of truth: Back, Forward or a link elsewhere cancel a pending debounce and
  discard anything not yet in the URL. Unmounting cancels a pending debounce too, and so does
  hiding the tree with React 19's `<Activity>`: the draft is dropped, not left pending.
- A click on a link while a debounce waits commits it at once, so the link the user follows is
  never overtaken by a search that was still waiting.
- `reset()` returns every param to its default in one navigation, keeping parameters the list
  does not own.
- `toggleSort(field)` exists when the list declares exactly one `sortParam`; `field` is typed to
  its fields. Single mode (the default) flips the primary sort, and any other field starts
  ascending and replaces the others; `{ multiple: true }` flips the field in place, or appends it,
  keeping the other sorts.

Every component that calls the hook with the same list reads the same URL. The draft and
`isPending` belong to the hook that made the change: when several components need them, call the
hook once in their common parent and pass the handle down.

### How a list finds its router

- The nearest adapter provider supplies it. The provider hands down the adapter _hook_, so only
  the components that use a list re-render when the URL changes.
- An adapter passed as the second argument wins over the provider:
  `useQubeeList(articleList, useBrowserAdapter())`. Each adapter has a hook form —
  `useReactRouterAdapter()`, `useTanStackRouterAdapter()`, `useNextAdapter()`.
- With neither, `useQubeeList` throws `MissingRouterAdapterError`. It never falls back to browser
  history by itself: inside a router library, that would leave the router out of step.
- For a router this package ships no adapter for, `createAdapterProvider(useMyAdapter)` makes a
  provider from a hook that returns a `RouterAdapter`: the current `pathname` and `search`, and a
  `navigate(href, { replace })`.
- In development, two different lists under one provider that name a URL parameter the same log
  a warning: paging one would page the other. To share a value on purpose, declare the param once
  and use the same object in both lists.

### Notes for each router

- **Every router adapter keeps the scroll position** when a list navigates; `scroll` hands it back
  to the router: `<ReactRouterAdapter scroll>`, `<TanStackRouterAdapter scroll>`,
  `<NextAdapter scroll>`.
- **No router library.** `<BrowserAdapter>` uses `history.pushState` / `replaceState` and
  `popstate`, and keeps every component on the page in sync. It observes only its own `navigate`
  and Back/Forward: a `history.pushState` by other code is not seen until the next `popstate`.
- **React Router.** `<ReactRouterAdapter>` goes inside the router, around the root route's
  `<Outlet />`. Render links with `<Link to={list.href({ page: 2 })}>`.
- **TanStack Router.** Its default search serialisers read every value as JSON, so a search box
  can lose what was typed — `10 ` lands as `10`. The
  [setup page](https://qubeejs-react.andreatantimonaco.me/setup/tanstack-router/) has a pair of
  serialisers that keeps text as text.
- **Next.js App Router.** A Server Component layout renders `<NextAdapter>` directly. A component
  that uses a list on a statically rendered route needs a `<Suspense>` boundary above it, or
  `next build` fails: the adapter reads `useSearchParams`. `QubeeProvider` takes a driver and
  `QubeeFetchProvider` a function, which cannot cross the server–client boundary as props, so they
  go in a client component of your own.

## Fetching

`list.request` describes the page to fetch. `useQubeeQuery` fetches it, and fetches again when it
changes — once per navigation, never per keystroke.

- It returns `{ data, error, isFetching, isLoading, refetch }`. `data` is core's plain
  `PaginatedResult`: the rows, and `lastPage`, `total`, `from`, `to` beside them.
- The previous page stays on screen while the next one loads; a request that is replaced is
  aborted, and its answer ignored.
- A status that is not `ok` becomes a `QubeeFetchError`, with `status`, `uri` and `response`.
- `null` — or `enabled: false` — fetches nothing.
- It keeps no cache: for one, and for retries and refetching on focus, use TanStack Query or SWR.

What performs the request is the global `fetch`, or your own fetcher — a function with the shape
of `fetch` — for a subtree or for one hook:

```tsx
import type { QubeeFetcher } from '@qubeejs/react';
import { QubeeFetchProvider } from '@qubeejs/react';

const authFetch: QubeeFetcher = (uri, init) =>
  fetch(uri, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token()}` } });

<QubeeFetchProvider fetcher={authFetch}>
  <App />
</QubeeFetchProvider>;
```

**On the server**, or anywhere outside React, call the function the hook is built on. It lives in
`@qubeejs/react/fetch`, an entry that is not a client module, so a Server Component can call it:

```tsx
import { buildListRequest, readListState } from '@qubeejs/core';
import { fetchQubeePage } from '@qubeejs/react/fetch';

const request = buildListRequest(articleList, readListState(articleList, await searchParams));
const page = await fetchQubeePage<Article>(request);
```

**TanStack Query** — `@qubeejs/react/tanstack-query` turns a request into query options: the key,
`['qubee', uri, headers]`, and a `queryFn` that fetches with TanStack's signal. Everything else is
yours to add:

```tsx
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

const list = useQubeeList(articleList);

const articles = useQuery({
  ...qubeeQueryOptions<Article>(list.request),
  placeholderData: keepPreviousData,
});
```

The options also fit `useSuspenseQuery`, `useQueries`, `prefetchQuery` and `ensureQueryData`; a
`null` request skips the query.

**SWR** — `@qubeejs/react/swr` is `useSWR` with the same key, a fetcher that goes through yours,
and the previous page kept while the next one loads:

```tsx
import { useQubeeSWR } from '@qubeejs/react/swr';

const list = useQubeeList(articleList);

const { data, error, isValidating } = useQubeeSWR<Article>(list.request);
```

Its options are SWR's own, except `fetcher`, which is a `QubeeFetcher`; without one it uses the
nearest `<QubeeFetchProvider>`'s.

`request.headers` is `null` unless the driver pages over headers (PostgREST in `RANGE` mode);
every fetching API sends them, and identifies a request by its address and its headers.

## Lists in memory

The same definition works without a URL — in a dialog, a picker, anywhere the page URL must not
change:

```tsx
import { MemoryAdapter, useMemoryAdapter, useQubeeList } from '@qubeejs/react';

// One component: the state belongs to it.
const tags = useQubeeList(tagList, useMemoryAdapter());

// Several components sharing one state.
<MemoryAdapter initialSearch="status=draft">
  <TagFilters />
  <TagTable />
</MemoryAdapter>;
```

The state starts from `initialSearch` and is gone when the component or the provider unmounts.
There is no history: `replace` makes no difference and there is no Back. Everything else — typed
state, `set()`, debounce, `isPending`, `request` — behaves as with a URL.

## The query builder: `useQubee` and `QubeeProvider`

For a query assembled step by step, in ways a list definition does not describe, a component can
hold a qubee instance and drive the builder itself:

```tsx
import { STRAPI_DRIVER } from '@qubeejs/core';
import { useQubee } from '@qubeejs/react';

function ArticlePicker(): ReactElement {
  const { builder, state } = useQubee({
    baseUrl: 'https://example.com/api',
    driver: STRAPI_DRIVER,
  });

  // Every builder call re-renders the component with the new state.
  return <button onClick={() => builder.nextPage()}>Page {state.page}</button>;
}
```

The instance is created on the first render and kept. Later changes to the config are ignored —
remount the component with a `key` to switch drivers. The hook renders on the server with the
store's initial state.

The filters, the table and the pager of one list can share an instance, as
`provideNgQubeeInstance()` does in Angular:

```tsx
import { STRAPI_DRIVER } from '@qubeejs/core';
import { QubeeProvider, useQubeeContext } from '@qubeejs/react';

<QubeeProvider baseUrl="https://example.com/api" driver={STRAPI_DRIVER}>
  <ArticleFilters />
  <ArticleTable />
</QubeeProvider>;

function ArticleFilters(): ReactElement {
  const { builder } = useQubeeContext();

  return <button onClick={() => builder.addFilter('status', 'published')}>Published</button>;
}
```

The context carries the instance, never its state, so the provider does not re-render its
subtree: only components that call `useQubeeContext()` re-render. The nearest provider wins. Pass
`value={qubee}` instead of a configuration to share an instance created elsewhere. Outside a
provider, `useQubeeContext()` throws `MissingQubeeProviderError`.

With the builder you fetch `builder.generateUri()` yourself and call `paginator.paginate()`: the
fetching hooks take a list's `request`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODING-STANDARDS.md](./CODING-STANDARDS.md).

## License

MIT © [Andrea Tantimonaco](https://andreatantimonaco.me)
