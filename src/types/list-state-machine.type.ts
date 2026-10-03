/**
 * What {@link useQubeeList} tracks between the URL and what the user asked for. Every href in it
 * is a pathname plus a normalised query, so hrefs compare as strings.
 *
 * Internal.
 */
export type ListStateMachine = {
  /** A debounced `set()` is waiting to commit `draft`. */
  debouncing: boolean;
  /** The href the latest `set()` produced, until the URL reflects it; `null` once settled. */
  draft: string | null;
  /** Hrefs handed to `navigate()` and not yet seen in the URL, oldest first. */
  inflight: readonly string[];
  /** The URL the machine last observed. */
  location: string;
};
