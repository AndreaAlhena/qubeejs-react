# Coding Standards

`@qubeejs/react` follows the standards of
[`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core/blob/master/CODING-STANDARDS.md),
adapted for React. Where the two differ, this file wins for this package — and it differs only
where React demands it.

Anything marked **[auto]** is enforced and auto-fixed by ESLint or Prettier — don't hand-maintain
it.

## Naming

### Files

`kebab-case`, with a prefix or suffix that states the kind:

| File                       | Contents                                              |
| -------------------------- | ----------------------------------------------------- |
| `hooks/use-*.ts`           | One exported hook, named `use…`                       |
| `components/*.tsx`         | One exported component, named in `PascalCase`         |
| `contexts/*.ts`            | One React context                                     |
| `*.type.ts`                | Any type — props, handles, router contracts           |
| `*.error.ts`               | An error class                                        |
| `*.interface.ts`           | An interface a class actually `implements` (none yet) |
| `*.enum.ts`                | An enum (none in `src/` yet)                          |
| `*.spec.ts` / `*.spec.tsx` | Tests, colocated beside the file under test           |

### Interface vs type — the decision rule

Ask: **will a class `implements` this?**

- **Yes** → `interface`, named with an `I` prefix, in `*.interface.ts`.
- **No** → `type`, no prefix, in `*.type.ts`.

In this package nothing qualifies: every shape is a `type`. `interface` is open — two
declarations of the same name merge silently — so a consumer or a stray `.d.ts` could augment a
public shape with no error. `type` is closed.

### Symbols

- Components, types, classes, enums: `PascalCase` **[auto for types]**
- Hooks: `camelCase` starting with `use` — the Rules of Hooks rely on the prefix.
- Variables, functions, members: `camelCase` **[auto for members]**
- **Constants — casing states how the value is produced** _(enforced by
  `test/conventions.spec.ts`)_:
  - `UPPER_SNAKE_CASE` for **literal / static** values — a string, number, regex, or an object or
    array literal written out in the source.
  - `camelCase` for anything **computed at runtime**, even when it never reassigns:
    `const qubeeContext = createContext(null)`, `const articleList = defineList({ … })`.
- A leading `_` on a **parameter** means "intentionally unused".

### Member visibility prefixes **[auto]**

- `private` members **must** carry a leading underscore.
- `protected` and `public` members **must not**.

## One kind per file

A file declares **one kind of thing**, and its name says which. The one exception: a
**non-exported** helper type or function used only by that file may live beside its consumer.

`test/conventions.spec.ts` enforces: one declaration kind per file, interfaces only in
`*.interface.ts`, exported types only in `*.type.ts`, the `I` prefix only on implemented
interfaces, `*Enum` naming in `*.enum.ts`, kebab-case filenames, hooks in `hooks/use-*.ts` (one
each), one `PascalCase` component per `.tsx`, constant casing, no Next.js imports or client
directives, no `node:` imports, and no network I/O.

## Ordering **[auto]**

**Alphabetise everything that can be alphabetised** — imports, named import bindings, class
members, JSON keys, ESLint rules, `tsconfig` options, `package.json` fields.
`eslint-plugin-perfectionist` sorts imports and class members; `prettier-plugin-sort-json` sorts
JSON. `perfectionist/sort-objects` runs on config files only, exactly as in `@qubeejs/core`, so
the two repositories lint alike. Run `npm run lint:fix`; never reorder by hand.

Class members are grouped in this order:

```
index signatures → static props → private props → protected props → public props
→ constructor → private methods → protected methods → public methods
```

## Type safety

- **No `any`.** Use `unknown` and narrow.
- **Explicit return types** on every function, method and component (`ReactElement`)
  **[auto-checked]**.
- **`import type`** for type-only imports **[auto]**.
- **Function members of public types are properties** (`set: (changes) => void`), not methods
  (`set(changes): void`), so a caller can destructure a handle without tripping
  `@typescript-eslint/unbound-method`.
- **Casts** (`as`) only at a documented generic boundary, with a comment saying what the compiler
  cannot see. Today there is one: `useListState` narrows its handle to `ListStateHandle<TList>`,
  because `ListState<TList>` is a conditional type the compiler cannot evaluate while `TList` is
  generic.

## React

- **Rules of Hooks** and **exhaustive dependencies** **[auto — `react-hooks`]**.
- **No side effects during render.** Subscriptions, timers, navigation and ref writes belong in
  effects or event handlers; rendering only derives values from props, state and snapshots.
- **External state is read through `useSyncExternalStore`** with a server snapshot, so every hook
  renders on the server.
- **Stable identities.** Anything a hook returns that a caller may put in a dependency array — a
  handle, a callback, a router — is memoised.
- **Context carries stable instances, never changing state**, so a provider never re-renders its
  subtree.
- **Framework-free logic belongs in `@qubeejs/core`.** If a function does not need React, it does
  not belong here, and nothing from core is re-exported.
- **No `'use client'`, no `next` imports.** Server/client boundaries are `@qubeejs/next`'s job.

## Structure

- **Guard clauses over nesting.** Return early; avoid `else`.
- **Small, focused functions.** Break up walls of logic.
- **Separate declarative blocks from logic blocks.**

## Documentation

Every exported hook, component, type and error carries JSDoc, with an `@example` for hooks and
components. The documentation site's API reference is generated from it.

## Testing

- Every new feature ships with tests; every bug fix ships with a regression test.
- Unit specs are colocated: `use-qubee.spec.tsx` beside `use-qubee.ts`. Repo-wide checks, fixtures
  and helpers live in `test/`, and follow the same rules.
- **Every hook test renders inside `<StrictMode>`**, which double-invokes renders and effects the
  way development builds do.
- **Timers:** `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })`, restored after each
  test.
- **Server rendering:** `renderToString` from `react-dom/server`.
- **Types:** `expectTypeOf`, and `@ts-expect-error` with a reason, for inference that is part of
  the API.
- Structure: `describe('Subject') > describe('method') > it('should …')`, arrange/act/assert.
- Coverage thresholds in `vitest.config.ts` ratchet up, never down. CI runs the suite on React 18
  and 19.

## Git

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), lowercase, imperative, scoped, short,
referencing the issue:

```
feat(use-list-state): debounce set() and report it as pending (#7)
fix(use-browser-router): stop listening on unmount (#12)
```

**Commit messages must not contain AI assistant credits or co-author trailers.** Keep commits
**atomic** — one logical change each.

### Definition of done

Code, **plus** a `CHANGELOG.md` entry, an explicit SemVer impact, and any docs the change
invalidates. See [CONTRIBUTING.md](./CONTRIBUTING.md#definition-of-done).

### Branching

```
feature/<issue-number>  →  develop  →  master
```

One branch per operational block, tracked by a GitHub issue. `master` is release-only.
