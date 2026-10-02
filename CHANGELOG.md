# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: TypeScript, tsup (ESM + CJS), vitest with jsdom and Testing Library, ESLint
  with perfectionist, jsdoc and react-hooks, Prettier, repository convention checks, and CI across
  Node 22/24 and React 18/19 (#3)
- `useQubee(config)`: a qubee instance per component, created once, re-rendered through
  `useSyncExternalStore`, and safe to render on the server; it returns a `QubeeHandle` (#4)
- `QubeeProvider` and `useQubeeContext()`: one instance shared by a subtree, configured with flat
  `QubeeConfig` props or a `value` (`QubeeProviderProps`); only consumers re-render;
  `MissingQubeeProviderError` outside a provider (#5)
- `RouterAdapter`, the router contract of URL-driven lists, with `AdapterNavigateOptions` for its
  `navigate`, and `useBrowserAdapter()` for apps without a router — every instance in sync, safe
  to render on the server (#6, #13)
- `useQubeeList(list, adapter?)`: a list whose state lives in the page URL. Its `QubeeListHandle`
  has a draft `state` that updates synchronously, a typed `set()` that navigates at most once per
  call, optional debounce (`ListSetOptions`), `isPending`, `href()`, `setPage()`, `toggleSort()`
  when the list declares one `sortParam` (`SortToggle`), and a `request` that changes once per
  navigation for fetching libraries (#7, #15)
- **Documentation site** at https://qubeejs-react.andreatantimonaco.me: guides for the hooks and for
  lists whose query lives in the URL, eight recipes, and an API reference generated from JSDoc.
  Every usage sample is type-checked against the build, and the testing samples run, on each
  build (#8)
- Adapter providers: `<BrowserAdapter>` and `createAdapterProvider()` set a list's router adapter
  once for a subtree. `useQubeeList(list)` takes it from the nearest provider, an adapter passed
  as the second argument wins, and `MissingRouterAdapterError` reports that there is neither. In
  development, two different lists under one provider that claim the same URL parameter log a
  warning (#20)
- Lists in memory: `<MemoryAdapter>` and `useMemoryAdapter()` run a `defineList` definition
  without a URL — shared by the components under the provider, or owned by one component — for
  dialogs and pickers (#21)
- `reset()` on the list handle: every param back to its default in one navigation, keeping
  parameters the list does not own (#21)
- `@qubeejs/react/react-router`: `<ReactRouterAdapter>` and `useReactRouterAdapter()`, for React
  Router 7 and later — an entry point of its own, with `react-router` as an optional peer
  dependency (#22)
- `@qubeejs/react/tanstack-router`: `<TanStackRouterAdapter>` and `useTanStackRouterAdapter()`,
  for TanStack Router 1.49 and later, the first release whose `navigate` takes an href — an
  entry point of its own, with `@tanstack/react-router` as an optional peer dependency (#23, #32)
- A debounced change is committed at once when the user clicks a link, so that on routers that
  report the new URL late — the Next.js App Router, loaders that take time — a search still
  waiting cannot fire after the link was followed and pull the user back (#31)
- `@qubeejs/react/next`: `<NextAdapter>` and `useNextAdapter()`, for the Next.js App Router (15
  and later) — an entry point of its own, with `next` as an optional peer dependency. A Server
  Component layout can render the provider directly (#24)
- Every router adapter keeps the scroll position when a list navigates — a sort, a page, a
  debounced search landing — and takes `scroll` to hand it back to the router:
  `<ReactRouterAdapter scroll>`, `<TanStackRouterAdapter scroll>`, `<NextAdapter scroll>`, and the
  same option on their hooks (#24, #32)
- Built-in fetching: `useQubeeQuery(request, options?)` fetches the page a list asks for and
  fetches again when the request changes — the previous page kept meanwhile, a replaced request
  aborted, no cache. `<QubeeFetchProvider>` sets the fetcher (`QubeeFetcher`) for a subtree, and a
  status that is not `ok` becomes a `QubeeFetchError` (#25, #33)
- `@qubeejs/react/fetch`: `fetchQubeePage(request, options?)`, the function the hooks fetch with —
  a server-safe entry point, callable from a Server Component, a route loader or a script (#25)
- `@qubeejs/react/tanstack-query`: `qubeeQueryOptions(request, options?)`, the TanStack Query
  options of a list request — its key and a `queryFn` with TanStack's abort signal — for
  `useQuery`, `useSuspenseQuery`, `prefetchQuery` and the rest. A server-safe entry point of its
  own, with `@tanstack/react-query` 5.62 or later as an optional peer dependency (#26)
- `@qubeejs/react/swr`: `useQubeeSWR(request, options?)`, `useSWR` keyed on a list request, with
  the previous page kept while the next one loads and SWR's own options (`QubeeSWROptions`) — an
  entry point of its own, with `swr` 2 as an optional peer dependency (#27)
- A client boundary built in: the entry point is marked `'use client'`, so a Next.js Server
  Component can import the package's components without a wrapper file (#19)

### Changed

- Build against `@qubeejs/core` 1.3.0 from npm instead of a sibling checkout (#9)
