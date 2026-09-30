# @qubeejs/react

React hooks for [`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core): a query builder
per component or per subtree, and lists whose state lives in the URL.

[![CI](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreaAlhena/qubeejs-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**[Documentation](https://qubeejs-react.andreatantimonaco.me)**

The adapter re-renders your components when a query changes. It performs no I/O: it hands you
`{ uri, headers, paginate }`, and your fetching library — TanStack Query, SWR, plain `fetch` —
does the rest. Everything framework-free (drivers, the query builder, list definitions,
pagination helpers) is imported from `@qubeejs/core` and documented there.

## Install

```bash
npm i @qubeejs/react @qubeejs/core
```

React 18.3 or 19. No runtime dependencies.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODING-STANDARDS.md](./CODING-STANDARDS.md).

## License

MIT © [Andrea Tantimonaco](https://andreatantimonaco.me)
