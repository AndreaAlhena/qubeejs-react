import { defineList, integerParam, STRAPI_DRIVER, stringParam } from '@qubeejs/core';
import { MemoryAdapter, useQubeeList } from '@qubeejs/react';

import { API_URL } from './article-list';

/** How long typing must pause before the list changes. */
const SEARCH_DEBOUNCE_MS = 300;

/** Tags, searched and paged. Nothing here says where the state lives. */
const tagList = defineList({
  apply: (builder, { q }) => {
    builder.setLimit(10);

    if (q) {
      builder.addFilter('name', q);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
  },
  qubee: { baseUrl: API_URL, driver: STRAPI_DRIVER },
  resource: 'tags',
});

function TagSearch() {
  const tags = useQubeeList(tagList);

  return (
    <>
      <input
        aria-label="Search tags"
        onChange={(event) => tags.set({ q: event.target.value }, { debounce: SEARCH_DEBOUNCE_MS })}
        type="search"
        value={tags.state.q ?? ''}
      />
      <button onClick={() => tags.reset()} type="button">
        Clear
      </button>
    </>
  );
}

function TagPager() {
  const tags = useQubeeList(tagList);

  return (
    <button onClick={() => tags.setPage(tags.state.page + 1)} type="button">
      More — page {tags.state.page}
    </button>
  );
}

/** A dialog whose list never touches the page URL: both components share the provider's state. */
export function TagDialog() {
  return (
    <MemoryAdapter>
      <TagSearch />
      <TagPager />
    </MemoryAdapter>
  );
}
