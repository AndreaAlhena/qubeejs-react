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
  `useSyncExternalStore`, and safe to render on the server (#4)
- `QubeeProvider` and `useQubeeContext()`: one instance shared by a subtree, configured with flat
  `QubeeConfig` props or a `value`; only consumers re-render; `MissingQubeeProviderError` outside
  a provider (#5)
