import type { ReactElement } from 'react';

import type { AdapterProviderProps } from '../types/adapter-provider-props.type';

import { useBrowserAdapter } from '../hooks/use-browser-adapter';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make browser history the router adapter of every list below it — for apps without a router.
 *
 * Lists read the URL and navigate with `history.pushState` / `replaceState`; every list on the
 * page stays in sync, and the back and forward buttons work. Inside React Router, TanStack Router
 * or Next.js, use that router's adapter instead: their router would not see these navigations.
 *
 * @param props - The subtree
 * @returns The subtree, with the adapter in context
 *
 * @example
 * ```tsx
 * <BrowserAdapter>
 *   <Articles />
 * </BrowserAdapter>
 * ```
 */
export function BrowserAdapter(props: AdapterProviderProps): ReactElement {
  return (
    <AdapterScopeProvider useAdapter={useBrowserAdapter}>{props.children}</AdapterScopeProvider>
  );
}
