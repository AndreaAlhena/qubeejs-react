import type { QubeeListHandle } from '@qubeejs/react';

import type { articleList } from './article-list';

/** How long typing must pause before the URL changes. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The article search box. It shows the draft, so it never lags; it navigates
 * 300 ms after the last keystroke, replacing the history entry; Clear goes out
 * at once.
 */
export function ArticleSearch({ list }: { list: QubeeListHandle<typeof articleList> }) {
  return (
    <div role="search">
      <label htmlFor="article-search">Search articles</label>
      <input
        id="article-search"
        onChange={(event) =>
          list.set({ q: event.target.value }, { debounce: SEARCH_DEBOUNCE_MS, replace: true })
        }
        type="search"
        value={list.state.q ?? ''}
      />
      {list.state.q !== undefined && (
        <button onClick={() => list.set({ q: undefined })} type="button">
          Clear
        </button>
      )}
      <span aria-live="polite">{list.isPending ? 'Searching…' : ''}</span>
    </div>
  );
}
