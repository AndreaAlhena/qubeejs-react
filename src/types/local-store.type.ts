/**
 * A value that changes outside React, readable through `useSyncExternalStore`.
 *
 * Internal. Its members are properties, so they can be passed around unbound.
 */
export type LocalStore<T> = {
  /** The current value; the same reference until the next change. */
  getSnapshot: () => T;
  /** Follow changes; returns a function that stops following. */
  subscribe: (listener: () => void) => () => void;
  /** Replace the value with `reducer(current)`; subscribers hear of it only when it changed. */
  update: (reducer: (current: T) => T) => void;
};
