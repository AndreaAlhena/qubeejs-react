# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The first release: `@qubeejs/core` 1.3 for React 18.3 and 19. Pick your router, wrap the app once,
use the hook, fetch.

### Added

- **Lists in the URL.** `useQubeeList(list, adapter?)` drives a list declared with the core's
  `defineList`. Its `QubeeListHandle` has a draft `state` that updates synchronously, a typed
  `set()` that navigates at most once per call, optional debounce (`ListSetOptions`),
  `isPending`, `href()`, `setPage()`, `reset()`, `toggleSort()` when the list declares one
  `sortParam` (`SortToggle`), and a `request` that changes once per navigation. The URL is the
  source of truth: Back, Forward and links elsewhere discard what is not in it yet (#7, #15, #21)
- **A link is never overtaken by a pending debounce.** A debounced change is committed at once
  when the user clicks a link — also one inside a shadow root — so that on routers that report
  the new URL late, a search still waiting cannot fire after the link was followed and pull the
  user back (#31, #35)
- **Adapter providers.** A list reads and writes the URL through a `RouterAdapter`, set once for a
  subtree by a provider and found by `useQubeeList(list)`; an adapter passed as the second
  argument wins, and `MissingRouterAdapterError` reports that there is neither.
  `<BrowserAdapter>` and `useBrowserAdapter()` are for apps without a router library, and
  `createAdapterProvider()` makes a provider for any other router. In development, two different
  lists under one provider that claim the same URL parameter log a warning (#6, #13, #20)
- **`@qubeejs/react/react-router`**: `<ReactRouterAdapter>` and `useReactRouterAdapter()`, for
  React Router 7 and later (#22)
- **`@qubeejs/react/tanstack-router`**: `<TanStackRouterAdapter>` and
  `useTanStackRouterAdapter()`, for TanStack Router 1.49 and later, the first release whose
  `navigate` takes an href; and `parseSearch` and `stringifySearch`, search serialisers for
  `createRouter` that keep a query as plain text, so that a search box keeps what was typed
  (#23, #32, #34, #36)
- **`@qubeejs/react/next`**: `<NextAdapter>` and `useNextAdapter()`, for the Next.js App Router,
  15 and later. A Server Component layout can render the provider directly (#24)
- **Scroll stays where it is.** Every router adapter keeps the scroll position when a list
  navigates, and takes `scroll` to hand it back to the router (#24, #32)
- **Lists in memory.** `<MemoryAdapter>` and `useMemoryAdapter()` run a list definition without a
  URL — shared by the components under the provider, or owned by one component — for dialogs and
  pickers (#21)
- **Built-in fetching.** `useQubeeQuery(request, options?)` fetches the page a list asks for and
  fetches again when the request changes: the previous page kept meanwhile, a replaced request
  aborted and its answer ignored, the flags right from the first render, on the server too, and
  no cache. `<QubeeFetchProvider>` sets the fetcher (`QubeeFetcher`) of a subtree, and a status
  that is not `ok` becomes a `QubeeFetchError` (#25, #33)
- **`@qubeejs/react/fetch`**: `fetchQubeePage(request, options?)`, the function everything
  fetches with — a server-safe entry point, callable from a Server Component, a route loader or a
  script (#25)
- **`@qubeejs/react/tanstack-query`**: `qubeeQueryOptions(request, options?)`, the TanStack Query
  options of a list request — its key and a `queryFn` with TanStack's abort signal — for
  `useQuery`, `useSuspenseQuery`, `prefetchQuery` and the rest. A server-safe entry point, for
  TanStack Query 5.62 and later (#26)
- **`@qubeejs/react/swr`**: `useQubeeSWR(request, options?)`, `useSWR` keyed on a list request,
  with the previous page kept while the next one loads and SWR's own options
  (`QubeeSWROptions`), for SWR 2 (#27)
- **The query builder in React.** `useQubee(config)` gives a component a qubee instance of its
  own, re-rendered through `useSyncExternalStore` and safe to render on the server
  (`QubeeHandle`). `<QubeeProvider>` and `useQubeeContext()` share one instance across a subtree:
  only its consumers re-render, and `MissingQubeeProviderError` reports a missing provider
  (#4, #5)
- **Packaging.** ES modules and CommonJS with type declarations for both, one entry point per
  integration with its library as an optional peer dependency, and no runtime dependencies. The
  entries that export hooks or components are marked `'use client'`, so a Next.js Server
  Component can import the package's components without a wrapper file; `fetch` and
  `tanstack-query` are not, so a Server Component can call what they export (#19)
- **Documentation site** at https://qubeejs-react.andreatantimonaco.me: a setup page for each
  router, guides, recipes, and an API reference generated from JSDoc and grouped by entry point.
  Every usage sample is type-checked against the build, and the testing samples run, on each
  build (#8, #28)
