# Contributing

Thanks for considering a contribution.

## Standards

Read **[CODING-STANDARDS.md](./CODING-STANDARDS.md)** first — most of it is enforced
automatically. `test/conventions.spec.ts` asserts the structural rules, so a convention slip fails
the build rather than a review.

## Setup

```bash
npm ci
npm test
```

Node `^22.12 || ^24 || >=26`; CI runs on 22.12 and 24.

## Before opening a pull request

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

CI runs exactly these on Node 22 and 24 × React 18 and 19, then checks the build entry by entry
(`npm run check:dist`): both formats and their types exist and load, the `'use client'` directive
is on the client entries only, each entry imports nothing but `react`, `@qubeejs/core` and its
own optional peer, and the package still has zero runtime dependencies. `npm run lint:package`
runs publint and are-the-types-wrong on the packed package.

A second job installs the packed tarball in a fresh project outside the repository and
type-checks and runs it there, as ESM and as CommonJS, on React 18 and 19
(`npm run test:consumer`, after a build). The project is `consumer/`.

A third job builds the Next.js app in `fixtures/next-app` with the packed tarball and, on the
current Next.js major, drives it in a browser with Playwright (`npm run test:next`, after a
build). It uses an installed Chrome; set `PLAYWRIGHT_CHANNEL=msedge` to use Edge instead.

Entry points are listed once, in `entries.json`. To add one: add its line there, its source file
under `src/entries/`, its block in `package.json` `exports`, and — when it has an optional peer —
the peer in `peerDependencies` and `peerDependenciesMeta`.

Coverage thresholds ratchet up, never down. If a change drops coverage, add tests rather than
lowering the threshold.

## Definition of done

An issue is not finished when the code works. Every issue also updates:

1. **`CHANGELOG.md`** — an entry under `## [Unreleased]`, in the right section
   (`Added` / `Changed` / `Fixed`), referencing the issue number.
2. **The SemVer impact** — stated explicitly. Breaking is a major, additive is a minor, a fix is a
   patch.
3. **The docs** — whatever the change invalidates: the README and the documentation site. The API
   reference regenerates itself from JSDoc; hand-written pages do not.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), lowercase, imperative, scoped, one
logical change each, referencing the issue. Commit messages must not contain AI assistant credits
or co-author trailers.

Branch from `develop` as `feature/<issue-number>`; `master` is release-only.

## Releasing

1. Bump the version and date the `CHANGELOG.md` section.
2. Merge `develop` into `master`.
3. Tag `v<version>` and publish a GitHub Release.

The publish workflow verifies that the tag matches `package.json`, re-runs the type check, the
linter, the tests and the build, and publishes to npm with provenance via OIDC trusted publishing
— there is no npm token.
