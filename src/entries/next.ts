/**
 * `@qubeejs/react/next` — the router adapter for the Next.js App Router.
 *
 * Its own entry point, so that only apps that import it need `next` installed. Server Components
 * need nothing from here beyond rendering {@link NextAdapter}: they read state, build requests
 * and build links with `@qubeejs/core`.
 *
 * @module
 */

// Types
export type { NextAdapterOptions } from '../types/next-adapter-options.type';
export type { NextAdapterProps } from '../types/next-adapter-props.type';

// Components
export { NextAdapter } from '../components/next-adapter';

// Hooks
export { useNextAdapter } from '../hooks/use-next-adapter';
