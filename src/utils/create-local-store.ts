import type { LocalStore } from '../types/local-store.type';

/**
 * Create a {@link LocalStore}.
 *
 * Event handlers write to it synchronously, so two writes in one handler see each other; React
 * reads it through `useSyncExternalStore`, which keeps concurrent renders consistent.
 *
 * @param initial - The first value
 * @returns The store
 */
export function createLocalStore<T>(initial: T): LocalStore<T> {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: (): T => current,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    update: (reducer: (value: T) => T): void => {
      const next = reducer(current);

      if (Object.is(next, current)) {
        return;
      }

      current = next;
      listeners.forEach((listener) => listener());
    },
  };
}
