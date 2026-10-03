import type { Qubee } from '@qubeejs/core';

import { useMemo, useSyncExternalStore } from 'react';

import type { QubeeHandle } from '../types/qubee-handle.type';

/**
 * Subscribe a component to an existing qubee instance.
 *
 * Internal: {@link useQubee} and {@link useQubeeContext} share it. The store's initial snapshot
 * is deterministic, so it doubles as the server snapshot and the hook renders on the server.
 *
 * @param qubee - The instance to follow
 * @returns The instance plus its current state, memoised on the state
 */
export function useQubeeHandle(qubee: Qubee): QubeeHandle {
  const { store } = qubee;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return useMemo((): QubeeHandle => ({ ...qubee, state }), [qubee, state]);
}
