/**
 * One restartable timer. Internal to {@link useListState}.
 */
export type Debouncer = {
  /** Drop the pending callback, if any. */
  cancel: () => void;
  /** Run `callback` after `delay` milliseconds, replacing any callback still pending. */
  schedule: (callback: () => void, delay: number) => void;
};
