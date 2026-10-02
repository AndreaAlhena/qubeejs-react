import type { SearchParamsInput } from '@qubeejs/core';

import { useState } from 'react';

import type { RouterAdapter } from '../types/router-adapter.type';

import { createMemoryLocation } from '../utils/memory-location';
import { useMemoryLocation } from './use-memory-location';

/**
 * A {@link RouterAdapter} that keeps a list's query in memory instead of the URL — for a list
 * in a dialog, a picker, or anywhere the page URL must not change.
 *
 * The state belongs to the calling component and is gone when it unmounts. There is no history:
 * `replace` makes no difference and there is no Back. To share one state between several
 * components, wrap them in {@link MemoryAdapter} instead.
 *
 * @param initialSearch - The query the list starts from, read on the first render only
 * @returns An adapter whose location lives in the component
 *
 * @example
 * ```tsx
 * function TagPicker(): ReactElement {
 *   const tags = useQubeeList(tagList, useMemoryAdapter());
 *
 *   return <button onClick={() => tags.setPage(tags.state.page + 1)}>More</button>;
 * }
 * ```
 */
export function useMemoryAdapter(initialSearch?: SearchParamsInput): RouterAdapter {
  const [location] = useState(() => createMemoryLocation(initialSearch));

  return useMemoryLocation(location);
}
