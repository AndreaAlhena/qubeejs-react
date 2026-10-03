import type { ReactElement } from 'react';

import { useState } from 'react';

import type { TanStackRouterAdapterProps } from '../types/tanstack-router-adapter-props.type';

import { useTanStackRouterAdapter } from '../hooks/use-tanstack-router-adapter';
import { bindAdapterOptions } from '../utils/bind-adapter-options';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make TanStack Router the router adapter of every list below it.
 *
 * Render it inside the router — in the root route's component, around its `<Outlet />` — so the
 * lists read TanStack Router's location and navigate through it. Only the components that use a
 * list re-render when the URL changes.
 *
 * @param props - The subtree, and whether a list navigation scrolls to the top
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
export function TanStackRouterAdapter(props: TanStackRouterAdapterProps): ReactElement {
  const [useAdapter] = useState(() =>
    bindAdapterOptions(useTanStackRouterAdapter, { scroll: props.scroll })
  );

  return <AdapterScopeProvider useAdapter={useAdapter}>{props.children}</AdapterScopeProvider>;
}
