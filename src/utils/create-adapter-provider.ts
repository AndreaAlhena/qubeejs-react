import type { ReactElement } from 'react';

import { createElement } from 'react';

import type { AdapterProviderProps } from '../types/adapter-provider-props.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { AdapterScopeProvider } from '../components/adapter-scope-provider';

/**
 * Make an adapter provider for a router this package ships no adapter for.
 *
 * Call it once, at module level, with a hook that returns a {@link RouterAdapter} built from your
 * router's own hooks. Lists below the provider call that hook themselves, so only they re-render
 * when the URL changes.
 *
 * @param useAdapter - A hook that takes no arguments and returns the location and a `navigate`
 * @returns A provider component that takes `children`
 *
 * @example
 * ```tsx
 * function useMyAdapter(): RouterAdapter {
 *   const { navigate, pathname, search } = useMyRouter();
 *
 *   return { navigate: (href, { replace }) => navigate(href, { replace }), pathname, search };
 * }
 *
 * export const MyAdapter = createAdapterProvider(useMyAdapter);
 * ```
 */
export function createAdapterProvider(
  useAdapter: () => RouterAdapter
): (props: AdapterProviderProps) => ReactElement {
  return function AdapterProvider(props: AdapterProviderProps): ReactElement {
    return createElement(AdapterScopeProvider, { children: props.children, useAdapter });
  };
}
