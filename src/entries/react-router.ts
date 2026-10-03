/**
 * `@qubeejs/react/react-router` — the router adapter for React Router 7 and later.
 *
 * Its own entry point, so that only apps that import it need `react-router` installed.
 *
 * @module
 */

// Types
export type { ReactRouterAdapterOptions } from '../types/react-router-adapter-options.type';
export type { ReactRouterAdapterProps } from '../types/react-router-adapter-props.type';

// Components
export { ReactRouterAdapter } from '../components/react-router-adapter';

// Hooks
export { useReactRouterAdapter } from '../hooks/use-react-router-adapter';
