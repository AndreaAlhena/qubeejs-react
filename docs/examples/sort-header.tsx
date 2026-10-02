import { getAriaSort } from '@qubeejs/core';
import type { QubeeListHandle } from '@qubeejs/react';
import type { ReactNode } from 'react';

import type { articleList } from './article-list';

type SortHeaderProps = {
  children: ReactNode;
  field: 'publishedAt' | 'title';
  list: QubeeListHandle<typeof articleList>;
};

/** The arrow for the direction a column is sorted in, if it is the primary sort. */
const ARROWS = { ascending: ' ▲', descending: ' ▼', none: '' } as const;

/**
 * A column header that sorts the list by its field: a click sorts ascending,
 * the next one flips it; a shift-click adds the field to the sorts in place.
 */
export function SortHeader({ children, field, list }: SortHeaderProps) {
  const direction = getAriaSort(list.state.sort, field);

  return (
    <th aria-sort={direction} scope="col">
      <button onClick={(event) => list.toggleSort(field, { multiple: event.shiftKey })} type="button">
        {children}
        <span aria-hidden="true">{ARROWS[direction]}</span>
      </button>
    </th>
  );
}
