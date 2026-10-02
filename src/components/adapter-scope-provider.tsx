import type { ReactElement } from 'react';

import { useState } from 'react';

import type { AdapterScopeProviderProps } from '../types/adapter-scope-provider-props.type';
import type { AdapterScope } from '../types/adapter-scope.type';

import { adapterContext } from '../contexts/adapter-context';
import { createListRegistry } from '../utils/list-registry';

/**
 * Put an adapter hook in context for the list hooks below.
 *
 * Internal: every adapter provider renders it. The scope is created once, on the first render,
 * and kept; a later `useAdapter` is ignored, so the hook a list calls never changes under it.
 *
 * @param props - The adapter hook and the subtree
 * @returns The subtree, with the adapter in context
 */
export function AdapterScopeProvider(props: AdapterScopeProviderProps): ReactElement {
  const [scope] = useState((): AdapterScope => ({
    registry: createListRegistry(),
    useAdapter: props.useAdapter,
  }));

  return <adapterContext.Provider value={scope}>{props.children}</adapterContext.Provider>;
}
