import type { ReactNode } from 'react';

/**
 * Props of an adapter provider: {@link BrowserAdapter}, and any provider made by
 * {@link createAdapterProvider}.
 */
export type AdapterProviderProps = {
  /** The subtree whose lists use this adapter. */
  children: ReactNode;
};
