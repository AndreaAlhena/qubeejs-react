import type { Debouncer } from '../types/debouncer.type';

/**
 * Create a {@link Debouncer}.
 *
 * @returns A timer with nothing pending
 */
export function createDebouncer(): Debouncer {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };

  return {
    cancel,
    schedule: (callback: () => void, delay: number): void => {
      cancel();
      timer = setTimeout(callback, delay);
    },
  };
}
