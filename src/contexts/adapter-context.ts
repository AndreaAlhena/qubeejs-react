import { createContext } from 'react';

import type { AdapterScope } from '../types/adapter-scope.type';

/**
 * Carries the nearest adapter provider's scope. `null` outside any provider.
 *
 * Internal: {@link useQubeeList} reads it.
 */
export const adapterContext = createContext<AdapterScope | null>(null);
