# Contributing

Thanks for considering a contribution.

## Standards

Read **[CODING-STANDARDS.md](./CODING-STANDARDS.md)** first — most of it is enforced
automatically. `test/conventions.spec.ts` asserts the structural rules, so a convention slip fails
the build rather than a review.

## Setup

Until `@qubeejs/core` 1.3.0 is on npm, this package builds against a sibling checkout of core:

```bash
git clone https://github.com/AndreaAlhena/qubeejs-core.git ../qubeejs-core
(cd ../qubeejs-core && git checkout develop && npm ci && npm run build)
npm ci
npm test
```

After pulling new core commits, run `npm run build` in `../qubeejs-core` again.

Node `^22.12 || ^24 || >=26` — the range CI covers.

## Before opening a pull request

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

CI runs exactly these on Node 22 and 24 × React 18 and 19, then verifies that both entry points
load, that no `'use client'` directive or `next` import reached the bundle, and that the package
still has zero runtime dependencies.

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

The publish workflow verifies that the tag matches `package.json`, re-runs every gate, and
publishes to npm with provenance via OIDC trusted publishing — there is no npm token.
