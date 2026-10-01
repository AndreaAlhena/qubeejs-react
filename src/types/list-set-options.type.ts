/**
 * Options of {@link ListStateHandle}'s `set`.
 */
export type ListSetOptions = {
  /**
   * Wait this many milliseconds before navigating, restarting on every call — for a search box.
   * The state updates at once regardless. `0` or absent navigates immediately.
   */
  debounce?: number;
  /** Replace the current history entry instead of pushing one. Default `false`. */
  replace?: boolean;
};
