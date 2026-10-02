# @qubeejs/react

React hooks for [`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core): a query builder
per component or per subtree, and lists whose state lives in the URL.

[![CI](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**[Documentation](https://qubeejs-react.andreatantimonaco.me)**

The adapter re-renders your components when a query changes, keeps a list's state in the URL
through your router, and fetches the page that state asks for — with a hook of its own, or
through TanStack Query or SWR. Everything framework-free (drivers, the query builder, list
definitions, pagination helpers) is imported from `@qubeejs/core` and documented there.

## Install

```bash
npm i @qubeejs/react @qubeejs/core
```

React 18.3 or 19. No runtime dependencies.

## An instance per component: `useQubee`

For lists whose state stays in memory — a dialog, a picker, an app without routing:

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

## One instance for a subtree: `QubeeProvider`

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

## Lists in the URL: `useQubeeList`

Declare the list once, with `@qubeejs/core`, as a module-level constant:

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

Then drive it from any component:

```tsx
import { getAriaSort } from '@qubeejs/core';
import { useBrowserAdapter, useQubeeList } from '@qubeejs/react';

function Articles(): ReactElement {
  const list = useQubeeList(articleList, useBrowserAdapter());

  return (
    <>
      <input
        value={list.state.q ?? ''}
        onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })}
      />
      <button onClick={() => list.set({ q: undefined, status: undefined })}>Clear filters</button>
      <th aria-sort={getAriaSort(list.state.sort, 'title')}>
        <button onClick={() => list.toggleSort('title')} type="button">
          Title
        </button>
      </th>
      <a href={list.href({ page: 2 })}>2</a>
      <button onClick={() => list.setPage(2)} type="button">
        Go to page 2
      </button>
    </>
  );
}
```

- `state` updates as soon as you call `set()`, so an input never lags behind a debounce or a
  server round-trip.
- `set()` navigates at most once per call. Values equal to their defaults stay out of the URL, a
  change to anything but the page returns to page 1, and parameters the list does not own are
  kept.
- `request` — `{ uri, headers, paginate }` — changes once per navigation, never per keystroke: use
  it as your cache key.
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

No provider is needed: the URL is the shared state. When several components need the same draft
or `isPending`, call the hook once in their common parent and pass the handle down.

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

## Routers

`useQubeeList` reads and writes the URL through a `RouterAdapter`: the current `pathname` and
`search`, and a `navigate(href, { replace })`.

### Set the adapter once

Wrap the app in an adapter provider, and every list below it finds its adapter by itself:

```tsx
import { BrowserAdapter, useQubeeList } from '@qubeejs/react';

<BrowserAdapter>
  <Articles />
</BrowserAdapter>;

function Articles(): ReactElement {
  const list = useQubeeList(articleList);

  return <a href={list.href({ page: 2 })}>2</a>;
}
```

- An adapter passed as the second argument wins over the provider.
- With neither, `useQubeeList` throws `MissingRouterAdapterError`. It never falls back to browser
  history by itself: inside a router library, that would leave the router out of step.
- The provider hands down the adapter _hook_, so only the components that use a list re-render
  when the URL changes.
- For a router this package ships no provider for, `createAdapterProvider(useMyAdapter)` makes
  one from a hook that returns a `RouterAdapter`.
- In development, two different lists under one provider that name a URL parameter the same log
  a warning: paging one would page the other. To share a value on purpose, declare the param once
  and use the same object in both lists.

### Or pass it to the hook

Build the adapter from your router's hooks on every render, and pass it as the second argument.

**No router** — `useBrowserAdapter()` uses `history.pushState` / `replaceState` and `popstate`, and
keeps every component on the page in sync:

```tsx
const list = useQubeeList(articleList, useBrowserAdapter());
```

It observes only its own `navigate` and Back/Forward: a `history.pushState` by other code is not
seen until the next `popstate`, so parameters that code added can be dropped by the next `set()`.
When something else also writes the URL, use your router's adapter below.

**React Router** (7 or later) — the adapter ships as `@qubeejs/react/react-router`. Wrap the
routes once, inside the router:

```tsx
import { ReactRouterAdapter } from '@qubeejs/react/react-router';

function Root(): ReactElement {
  return (
    <ReactRouterAdapter>
      <Outlet />
    </ReactRouterAdapter>
  );
}
```

`useReactRouterAdapter()` is its hook form, for the second argument of `useQubeeList`. A list
navigation keeps the scroll position; `<ReactRouterAdapter scroll>` lets React Router reset it.

**TanStack Router** (1.49 or later) — the adapter ships as `@qubeejs/react/tanstack-router`. Wrap the root
route's outlet once:

```tsx
import { TanStackRouterAdapter } from '@qubeejs/react/tanstack-router';

const rootRoute = createRootRoute({
  component: () => (
    <TanStackRouterAdapter>
      <Outlet />
    </TanStackRouterAdapter>
  ),
});
```

It navigates with whole hrefs, so a `basepath` is honoured, and keeps the scroll position;
`<TanStackRouterAdapter scroll>` turns the scrolling back on. `useTanStackRouterAdapter()` is its
hook form.

TanStack Router's default search serialisers read every value as JSON, so a search box can lose
what was typed — `10 ` lands as `10`. The
[TanStack Router setup page](https://qubeejs-react.andreatantimonaco.me/setup/tanstack-router/) has
a pair of serialisers that keeps text as text.

**Next.js App Router** (15 or later) — the adapter ships as `@qubeejs/react/next`. Render it in
the root layout; a Server Component can render it directly:

```tsx
// app/layout.tsx
import { NextAdapter } from '@qubeejs/react/next';

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <NextAdapter>{children}</NextAdapter>
      </body>
    </html>
  );
}
```

- Lists navigate without scrolling to the top; `<NextAdapter scroll>` turns that back on.
  `useNextAdapter()` is its hook form.
- A component that uses a list on a statically rendered route needs a `<Suspense>` boundary above
  it, or `next build` fails: the adapter reads `useSearchParams`.
- `QubeeProvider` takes a driver and `QubeeFetchProvider` a function, which cannot cross the
  server–client boundary as props, so they go in a client component of your own.
- Server Components read state, build requests and build links with `@qubeejs/core`, and fetch
  with `fetchQubeePage` from `@qubeejs/react/fetch`.

## Fetching

`list.request` describes the page to fetch. `useQubeeQuery` fetches it, and fetches again when it
changes — once per navigation, never per keystroke:

```tsx
import { useQubeeList, useQubeeQuery } from '@qubeejs/react';

const list = useQubeeList(articleList);
const articles = useQubeeQuery<Article>(list.request);

<ul aria-busy={list.isPending || articles.isFetching}>
  {articles.data?.data.map((article) => (
    <li key={article.id}>{article.title}</li>
  ))}
</ul>;
```

- It returns `{ data, error, isFetching, isLoading, refetch }`. `data` is core's plain
  `PaginatedResult`: the rows, and `lastPage`, `total`, `from`, `to` beside them.
- The previous page stays on screen while the next one loads; a request that is replaced is
  aborted, and its answer ignored.
- A status that is not `ok` becomes a `QubeeFetchError`, with `status`, `uri` and `response`.
- `null` — or `enabled: false` — fetches nothing. `initialData` is the page of the first render's
  request, when the server already fetched it.
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

**TanStack Query** (5.62 or later) — `@qubeejs/react/tanstack-query` turns a request into query
options: the key, `['qubee', uri, headers]`, and a `queryFn` that fetches with TanStack's signal.
Everything else is yours to add:

```tsx
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';

const list = useQubeeList(articleList);

const articles = useQuery({
  ...qubeeQueryOptions<Article>(list.request),
  placeholderData: keepPreviousData,
});
```

The options also fit `useSuspenseQuery`, `useQueries`, `prefetchQuery` and `ensureQueryData`; a
`null` request skips the query. The entry is not a client module, so a Server Component or a
loader can prefetch with it.

**SWR** (2.x) — `@qubeejs/react/swr` is `useSWR` with the same key, a fetcher that goes through
yours, and the previous page kept while the next one loads:

```tsx
import { useQubeeSWR } from '@qubeejs/react/swr';

const list = useQubeeList(articleList);

const { data, error, isValidating } = useQubeeSWR<Article>(list.request);
```

Its options are SWR's own, except `fetcher`, which is a `QubeeFetcher`; without one it uses the
nearest `<QubeeFetchProvider>`'s.

`request.headers` is `null` unless the driver pages over headers (PostgREST in `RANGE` mode);
every fetching API sends them, and identifies a request by its address and its headers.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODING-STANDARDS.md](./CODING-STANDARDS.md).

## License

MIT © [Andrea Tantimonaco](https://andreatantimonaco.me)
