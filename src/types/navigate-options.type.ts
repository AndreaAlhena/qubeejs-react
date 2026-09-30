/**
 * How {@link ListRouter}'s `navigate` should move to an href.
 */
export type NavigateOptions = {
  /**
   * Replace the current history entry instead of pushing a new one — for a search box, so that
   * Back leaves the page instead of undoing keystrokes.
   */
  replace: boolean;
};
