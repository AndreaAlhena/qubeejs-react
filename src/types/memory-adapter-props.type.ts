import type { SearchParamsInput } from '@qubeejs/core';
import type { ReactNode } from 'react';

/**
 * Props of {@link MemoryAdapter}.
 */
export type MemoryAdapterProps = {
  /** The subtree whose lists share the in-memory state. */
  children: ReactNode;
  /** The query the lists start from, e.g. `"status=draft"`. Read on the first render only. */
  initialSearch?: SearchParamsInput;
};
