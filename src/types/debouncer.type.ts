/**
 * One restartable timer. Internal to {@link useQubeeList}.
 */
export type Debouncer = {
  /** Drop the pending callback, if any. */
  cancel: () => void;
  /** Run the pending callback now, if any, instead of waiting for its delay. */
  flush: () => void;
  /** Run `callback` after `delay` milliseconds, replacing any callback still pending. */
  schedule: (callback: () => void, delay: number) => void;
};
