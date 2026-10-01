# @qubeejs/react

React hooks for `@qubeejs/core`: `useQubee`, `QubeeProvider` + `useQubeeContext`, `useListState`
and `useBrowserRouter`. `@qubeejs/next` builds on this package.

## Coding standards

See **[CODING-STANDARDS.md](./CODING-STANDARDS.md)** — the single source of truth, ported from
`@qubeejs/core`. Highlights that are easy to get wrong:

- `private` members require a leading `_`; `protected` and `public` must not have one.
- Every shape is a `type` in `*.type.ts`; no interfaces, no `I` prefix.
- Hooks live in `hooks/use-*.ts`, one per file; components in `.tsx`, one per file.
- Function members of public types are properties, so handles can be destructured.
- Ordering is auto-fixed by perfectionist — run `npm run lint:fix`, don't reorder by hand.
- No `any`. No `'use client'`, no `next` imports, no `fetch`. No AI credits in commit messages.
- **Every issue ships code + changelog entry + stated SemVer impact + docs.**

## Commands

```bash
npm run build         # tsup → dual ESM + CJS
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
├─ components/  QubeeProvider
├─ contexts/    qubeeContext (internal)
├─ errors/      MissingQubeeProviderError
├─ hooks/       useQubee · useQubeeContext · useBrowserRouter · useListState · useQubeeHandle (internal)
├─ types/       public handles and props, plus internal machine / store / debouncer / loose-list shapes
└─ utils/       href, browser history, local store, list-state machine, debouncer (all internal)
```

`useListState` keeps three layers: the **draft** (updated synchronously by `set()`), the
**in-flight** hrefs handed to `navigate()`, and the **URL**, which always wins.
