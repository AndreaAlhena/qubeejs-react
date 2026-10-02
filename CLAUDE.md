# @qubeejs/react

React hooks for `@qubeejs/core`: `useQubee`, `QubeeProvider` + `useQubeeContext`, `useQubeeList`
and `useBrowserAdapter`. Router and fetching integrations ship as entry points of this package
(`entries.json`); there is no separate Next.js package.

## Coding standards

See **[CODING-STANDARDS.md](./CODING-STANDARDS.md)** — the single source of truth, ported from
`@qubeejs/core`. Highlights that are easy to get wrong:

- `private` members require a leading `_`; `protected` and `public` must not have one.
- Every shape is a `type` in `*.type.ts`; no interfaces, no `I` prefix.
- Hooks live in `hooks/use-*.ts`, one per file; components in `.tsx`, one per file.
- Function members of public types are properties, so handles can be destructured.
- Ordering is auto-fixed by perfectionist — run `npm run lint:fix`, don't reorder by hand.
- No `any`. No `'use client'` in the source (the build adds it per entry), no optional peer
  outside its own entry, no `fetch`. No AI credits in commit messages.
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
│               next · react-router · tanstack-router
├─ components/  QubeeProvider · BrowserAdapter · MemoryAdapter · NextAdapter · ReactRouterAdapter ·
│               TanStackRouterAdapter · AdapterScopeProvider (internal)
├─ contexts/    qubeeContext · adapterContext (both internal)
├─ errors/      MissingQubeeProviderError · MissingRouterAdapterError
├─ hooks/       useQubee · useQubeeContext · useBrowserAdapter · useMemoryAdapter · useNextAdapter ·
│               useReactRouterAdapter · useTanStackRouterAdapter · useQubeeList,
│               plus internal useQubeeHandle · useRouterAdapter · useNoAdapter · useMemoryLocation
├─ types/       public handles and props, plus internal machine / store / debouncer / loose-list /
│               adapter-scope / list-registry shapes
└─ utils/       createAdapterProvider, plus internal href, browser history, local store,
                list-state machine, debouncer, list registry, memory location, adapter options
                binding
```

A list finds its router adapter in the second argument of `useQubeeList`, else in the nearest
adapter provider; with neither it throws. A provider puts its adapter **hook** in context, never a
router value, so only list components subscribe to the URL.

`useQubeeList` keeps three layers: the **draft** (updated synchronously by `set()`), the
**in-flight** hrefs handed to `navigate()`, and the **URL**, which always wins.
