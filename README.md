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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODING-STANDARDS.md](./CODING-STANDARDS.md).

## License

MIT © [Andrea Tantimonaco](https://andreatantimonaco.me)
