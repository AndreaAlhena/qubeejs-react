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
- A client boundary built in: the entry point is marked `'use client'`, so a Next.js Server
  Component can import the package's components without a wrapper file (#19)

### Changed

- Build against `@qubeejs/core` 1.3.0 from npm instead of a sibling checkout (#9)
