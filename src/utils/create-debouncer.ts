import type { Debouncer } from '../types/debouncer.type';

/**
 * Create a {@link Debouncer}.
 *
 * @returns A timer with nothing pending
 */
export function createDebouncer(): Debouncer {
  let pending: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    pending = undefined;
    timer = undefined;
  };

  const flush = (): void => {
    const callback = pending;

    cancel();
    callback?.();
  };

  return {
    cancel,
    flush,
    schedule: (callback: () => void, delay: number): void => {
      cancel();
      pending = callback;
      timer = setTimeout(flush, delay);
    },
  };
}
