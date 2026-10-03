import type { ReactElement } from 'react';

import { useState } from 'react';

import type { MemoryAdapterProps } from '../types/memory-adapter-props.type';

import { createMemoryAdapterHook, createMemoryLocation } from '../utils/memory-location';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Keep the query of every list below it in memory instead of the URL, and share it between them
 * — the filters, the table and the pager of a list in a dialog.
 *
 * The state lives in the provider: it starts from `initialSearch` and is gone when the provider
 * unmounts. There is no history, so `replace` makes no difference and there is no Back. Nesting
 * scopes a subtree: the nearest adapter provider wins. For a list that one component drives
 * alone, {@link useMemoryAdapter} needs no provider.
 *
 * @param props - The subtree, and the query to start from
 * @returns The subtree, with the adapter in context
 *
 * @example
 * ```tsx
 * <MemoryAdapter initialSearch="status=draft">
 *   <TagFilters />
 *   <TagTable />
 * </MemoryAdapter>
 * ```
 */
export function MemoryAdapter(props: MemoryAdapterProps): ReactElement {
  const [useAdapter] = useState(() =>
    createMemoryAdapterHook(createMemoryLocation(props.initialSearch))
  );

  return <AdapterScopeProvider useAdapter={useAdapter}>{props.children}</AdapterScopeProvider>;
}
