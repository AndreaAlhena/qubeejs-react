import type { ReactElement } from 'react';

import type { AdapterProviderProps } from '../types/adapter-provider-props.type';

import { useTanStackRouterAdapter } from '../hooks/use-tanstack-router-adapter';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make TanStack Router the router adapter of every list below it.
 *
 * Render it inside the router — in the root route's component, around its `<Outlet />` — so the
 * lists read TanStack Router's location and navigate through it. Only the components that use a
 * list re-render when the URL changes.
 *
 * @param props - The subtree
 * @returns The subtree, with the adapter in context
 *
 * @example
 * ```tsx
 * const rootRoute = createRootRoute({
 *   component: () => (
 *     <TanStackRouterAdapter>
 *       <Outlet />
 *     </TanStackRouterAdapter>
 *   ),
 * });
 * ```
 */
export function TanStackRouterAdapter(props: AdapterProviderProps): ReactElement {
  return (
    <AdapterScopeProvider useAdapter={useTanStackRouterAdapter}>
      {props.children}
    </AdapterScopeProvider>
  );
}
