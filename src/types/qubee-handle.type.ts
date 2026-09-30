import type { Qubee, QueryBuilderState } from '@qubeejs/core';

/**
 * What {@link useQubee} and {@link useQubeeContext} return: the qubee instance plus the store's
 * current state.
 *
 * `builder`, `paginator` and `store` keep their identity for the instance's lifetime. `state` is
 * a new frozen snapshot after every write, so it is safe in a dependency array.
 */
export type QubeeHandle = Qubee & {
  /**
   * The store's current snapshot. The component re-renders after every write to the store.
   */
  state: QueryBuilderState;
};
