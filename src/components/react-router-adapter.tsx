import type { ReactElement } from 'react';

import type { AdapterProviderProps } from '../types/adapter-provider-props.type';

import { useReactRouterAdapter } from '../hooks/use-react-router-adapter';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make React Router the router adapter of every list below it.
 *
 * Render it inside the router — in the root route's component, around its `<Outlet />` — so the
 * lists read React Router's location and navigate through it. Only the components that use a list
 * re-render when the URL changes.
 *
 * @param props - The subtree
 * @returns The subtree, with the adapter in context
 *
 * @example
 * ```tsx
 * function Root(): ReactElement {
 *   return (
 *     <ReactRouterAdapter>
 *       <Outlet />
 *     </ReactRouterAdapter>
 *   );
 * }
 * ```
 */
export function ReactRouterAdapter(props: AdapterProviderProps): ReactElement {
  return (
    <AdapterScopeProvider useAdapter={useReactRouterAdapter}>{props.children}</AdapterScopeProvider>
  );
}
