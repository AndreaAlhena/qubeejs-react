# @qubeejs/react

React hooks for [`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core): a query builder
per component or per subtree, and lists whose state lives in the URL.

[![CI](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**[Documentation](https://qubeejs-react.andreatantimonaco.me)**

The adapter re-renders your components when a query changes. It performs no I/O: it hands you
`{ uri, headers, paginate }`, and your fetching library — TanStack Query, SWR, plain `fetch` —
does the rest. Everything framework-free (drivers, the query builder, list definitions,
pagination helpers) is imported from `@qubeejs/core` and documented there.

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

## Lists in the URL: `useListState`

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
import { useBrowserRouter, useListState } from '@qubeejs/react';

function Articles(): ReactElement {
  const list = useListState(articleList, useBrowserRouter());

  return (
    <>
      <input
        value={list.state.q ?? ''}
        onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })}
      />
      <button onClick={() => list.set({ q: undefined, status: undefined })}>Clear filters</button>
      <th
        aria-sort={getAriaSort(list.state.sort, 'title')}
        onClick={() => list.toggleSort('title')}
      >
        Title
      </th>
      <a
        href={list.href({ page: 2 })}
        onClick={(e) => {
          e.preventDefault();
          list.setPage(2);
        }}
      >
        2
      </a>
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
  discard anything not yet in the URL. Unmounting cancels a pending debounce too.
- `toggleSort(field)` exists when the list declares exactly one `sortParam`; `field` is typed to
  its fields. In single mode it flips only the primary sort.

No provider is needed: the URL is the shared state. When several components need the same draft
or `isPending`, call the hook once in their common parent and pass the handle down.

## Routers

`useListState` takes a `ListRouter`: the current `pathname` and `search`, and a
`navigate(href, { replace })`. Build it from your router's hooks on every render.

**No router** — `useBrowserRouter()` uses `history.pushState` / `replaceState` and `popstate`, and
keeps every component on the page in sync:

```tsx
const list = useListState(articleList, useBrowserRouter());
```

**React Router v7** (on v6.4+ the same hooks come from `'react-router-dom'`):

```ts
import type { ListRouter } from '@qubeejs/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export function useReactRouterList(): ListRouter {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return { navigate: (href, { replace }) => void navigate(href, { replace }), pathname, search };
}
```

**TanStack Router**:

```ts
import type { ListRouter } from '@qubeejs/react';
import { useRouter, useRouterState } from '@tanstack/react-router';

export function useTanStackRouterList(): ListRouter {
  const router = useRouter();
  const { pathname, searchStr } = useRouterState({ select: (state) => state.location });

  return {
    navigate: (href, { replace }) => void router.navigate({ href, replace }),
    pathname,
    search: searchStr,
  };
}
```

**Next.js App Router** (until `@qubeejs/next` ships `useNextRouter()`):

```ts
'use client';

import type { ListRouter } from '@qubeejs/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useNextRouterList(): ListRouter {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  return {
    navigate: (href, { replace }) =>
      replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false }),
    pathname,
    search,
  };
}
```

## Fetching

The adapter performs no I/O. `request` holds everything a fetch needs.

**TanStack Query**:

```tsx
const { request } = useListState(articleList, router);

const articles = useQuery({
  placeholderData: keepPreviousData,
  queryFn: async ({ signal }) => {
    const response = await fetch(request.uri, { headers: request.headers ?? {}, signal });

    return request.paginate<Article>(await response.json()).toPlain();
  },
  queryKey: ['articles', request.uri, request.headers],
});
```

**SWR**:

```tsx
const { request } = useListState(articleList, router);

const { data } = useSWR(
  [request.uri, request.headers],
  async ([uri, headers]) => {
    const response = await fetch(uri, { headers: headers ?? {} });

    return request.paginate<Article>(await response.json()).toPlain();
  },
  { keepPreviousData: true }
);
```

`toPlain()` returns a plain object, which TanStack Query can share structurally and a Server
Component can hand to a Client Component. `request.headers` is `null` unless the driver pages
over headers (PostgREST in `RANGE` mode).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODING-STANDARDS.md](./CODING-STANDARDS.md).

## License

MIT © [Andrea Tantimonaco](https://andreatantimonaco.me)
