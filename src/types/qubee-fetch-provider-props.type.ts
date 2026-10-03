import type { ReactNode } from 'react';

import type { QubeeFetcher } from './qubee-fetcher.type';

/**
 * Props of {@link QubeeFetchProvider}.
 */
export type QubeeFetchProviderProps = {
  /** The subtree whose fetching hooks use the fetcher. */
  children: ReactNode;
  /** What performs every request below, unless a hook is given its own. */
  fetcher: QubeeFetcher;
};
