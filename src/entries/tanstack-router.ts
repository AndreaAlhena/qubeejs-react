/**
 * `@qubeejs/react/tanstack-router` — the router adapter for TanStack Router 1.49 and later.
 *
 * Its own entry point, so that only apps that import it need `@tanstack/react-router` installed.
 *
 * @module
 */

// Types
export type { TanStackRouterAdapterOptions } from '../types/tanstack-router-adapter-options.type';
export type { TanStackRouterAdapterProps } from '../types/tanstack-router-adapter-props.type';

// Components
export { TanStackRouterAdapter } from '../components/tanstack-router-adapter';

// Hooks
export { useTanStackRouterAdapter } from '../hooks/use-tanstack-router-adapter';
