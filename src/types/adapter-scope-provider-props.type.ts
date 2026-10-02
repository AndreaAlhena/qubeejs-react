import type { ReactNode } from 'react';

import type { RouterAdapter } from './router-adapter.type';

/**
 * Props of {@link AdapterScopeProvider}.
 *
 * Internal.
 */
export type AdapterScopeProviderProps = {
  /** The subtree whose lists use the adapter. */
  children: ReactNode;
  /** The adapter hook. Read once, on the first render. */
  useAdapter: () => RouterAdapter;
};
