import type { ListRequest, ListState } from '@qubeejs/core';

import type { ListSetOptions } from './list-set-options.type';
import type { SortToggle } from './sort-toggle.type';

/**
 * What {@link useListState} returns for a list definition `TList`.
 *
 * Function members are properties, so the handle can be destructured. `toggleSort` is present
 * when the list declares exactly one `sortParam` — see {@link SortToggle}.
 */
export type ListStateHandle<TList> = {
  /**
   * The href for the current state with `changes` applied — for `<a>` and `<Link>`, which stay
   * crawlable, prefetchable and middle-clickable. Built from the draft, so it includes anything
   * `set()` has not committed yet.
   */
  href: (changes?: Partial<ListState<TList>>) => string;
  /** A debounce is waiting, or a navigation is in flight. */
  isPending: boolean;
  /**
   * `{ uri, headers, paginate }` for the committed state: it changes once per navigation, never
   * per keystroke, so use it as a fetching library's cache key.
   */
  request: ListRequest;
  /**
   * Apply `changes` to the state and navigate — at most one navigation per call. A change to
   * anything but the page returns to page 1; a key set to `undefined` returns to its default.
   */
  set: (changes: Partial<ListState<TList>>, options?: ListSetOptions) => void;
  /** `set({ page })`. */
  setPage: (page: number, options?: Omit<ListSetOptions, 'debounce'>) => void;
  /** The list's state, including changes not yet in the URL. */
  state: ListState<TList>;
} & SortToggle<TList>;
