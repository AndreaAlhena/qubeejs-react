import type { Qubee } from '@qubeejs/core';

import { createContext } from 'react';

/**
 * Carries the nearest {@link QubeeProvider}'s instance — never its state, so a provider does not
 * re-render its subtree when the query changes. `null` outside any provider.
 *
 * Internal: read it through {@link useQubeeContext}.
 */
export const qubeeContext = createContext<Qubee | null>(null);
