import type { ReactElement } from 'react';

import { useState } from 'react';

import type { ReactRouterAdapterProps } from '../types/react-router-adapter-props.type';

import { useReactRouterAdapter } from '../hooks/use-react-router-adapter';
import { bindAdapterOptions } from '../utils/bind-adapter-options';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make React Router the router adapter of every list below it.
 *
 * Render it inside the router — in the root route's component, around its `<Outlet />` — so the
 * lists read React Router's location and navigate through it. Only the components that use a list
 * re-render when the URL changes.
 *
 * @param props - The subtree, and whether a list navigation lets React Router reset the scroll
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
export function ReactRouterAdapter(props: ReactRouterAdapterProps): ReactElement {
  const [useAdapter] = useState(() =>
    bindAdapterOptions(useReactRouterAdapter, { scroll: props.scroll })
  );

  return <AdapterScopeProvider useAdapter={useAdapter}>{props.children}</AdapterScopeProvider>;
}
