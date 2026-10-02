# @qubeejs/react

React hooks for `@qubeejs/core`: `useQubee`, `QubeeProvider` + `useQubeeContext`, `useQubeeList`,
`useBrowserAdapter` and `useQubeeQuery`. Router and fetching integrations ship as entry points of
this package (`entries.json`); there is no separate Next.js package.

## Coding standards

See **[CODING-STANDARDS.md](./CODING-STANDARDS.md)** — the single source of truth, ported from
`@qubeejs/core`. Highlights that are easy to get wrong:

- `private` members require a leading `_`; `protected` and `public` must not have one.
- Every shape is a `type` in `*.type.ts`; no interfaces, no `I` prefix.
- Hooks live in `hooks/use-*.ts`, one per file; components in `.tsx`, one per file.
- Function members of public types are properties, so handles can be destructured.
- Ordering is auto-fixed by perfectionist — run `npm run lint:fix`, don't reorder by hand.
- No `any`. No `'use client'` in the source (the build adds it per entry), no optional peer
  outside its own entry, no React in a server-safe entry, and `fetch` named in one file only:
  `utils/fetch-qubee-page.ts`. No AI credits in commit messages.
- Entry points are listed once, in `entries.json`; the build, the convention tests, the dist check
  and the consumer test all read it.
- **Every issue ships code + changelog entry + stated SemVer impact + docs.**

## Commands

```bash
npm run build         # tsup → dual ESM + CJS, shared chunks, 'use client' on client entries
npm run check:dist    # after a build: every entry exists, loads and imports only what it may
npm run test:consumer # after a build: install the packed tarball in a fresh project and run it
npm run test:next     # after a build: build fixtures/next-app with the tarball, drive it in Chrome
npm run lint:package  # publint + are-the-types-wrong
npm test              # vitest run (jsdom)
npm run test:coverage
npm run lint          # eslint
npm run lint:fix
npm run typecheck     # tsc --noEmit
npm run format
```

## Architecture

The adapter owns **effects**: store subscriptions, navigation and timers. Everything **pure** —
list definitions, page URL ⇄ state ⇄ API request, pagination and sort helpers — lives in
`@qubeejs/core` and is imported from there, never re-implemented or re-exported.

```
src/
├─ entries/     one file per entry point besides index.ts, as entries.json lists them:
│               fetch · tanstack-query (both server-safe) · next · react-router · tanstack-router
├─ components/  QubeeProvider · QubeeFetchProvider · BrowserAdapter · MemoryAdapter · NextAdapter ·
│               ReactRouterAdapter · TanStackRouterAdapter · AdapterScopeProvider (internal)
├─ contexts/    qubeeContext · adapterContext · fetcherContext (all internal)
├─ errors/      MissingQubeeProviderError · MissingRouterAdapterError · QubeeFetchError
├─ hooks/       useQubee · useQubeeContext · useBrowserAdapter · useMemoryAdapter · useNextAdapter ·
│               useReactRouterAdapter · useTanStackRouterAdapter · useQubeeList · useQubeeQuery,
│               plus internal useQubeeHandle · useRouterAdapter · useNoAdapter · useMemoryLocation ·
│               useQubeeFetcher
├─ types/       public handles, props and options, plus internal machine / store / debouncer /
│               loose-list / adapter-scope / list-registry / query-state shapes
└─ utils/       createAdapterProvider · fetchQubeePage · qubeeQueryOptions, plus internal href,
                browser history, local store, list-state machine, debouncer, list registry, memory
                location, adapter options binding, query state, request key
```

A list finds its router adapter in the second argument of `useQubeeList`, else in the nearest
adapter provider; with neither it throws. A provider puts its adapter **hook** in context, never a
router value, so only list components subscribe to the URL.

Everything that fetches goes through `fetchQubeePage(request, { fetcher, signal })`, the one
function that performs I/O; `useQubeeQuery` adds request state on top, with no cache.

`useQubeeList` keeps three layers: the **draft** (updated synchronously by `set()`), the
**in-flight** hrefs handed to `navigate()`, and the **URL**, which always wins.
