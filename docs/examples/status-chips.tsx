import type { ListStateHandle } from '@qubeejs/react';
import type { MouseEvent } from 'react';

import { type articleList, ArticleStatusEnum } from './article-list';
import { isPlainClick } from './plain-click';

/** The chips, in the order they are shown; `undefined` means every status. */
const CHIPS = [
  { label: 'All', status: undefined },
  { label: 'Published', status: ArticleStatusEnum.PUBLISHED },
  { label: 'Drafts', status: ArticleStatusEnum.DRAFT },
] as const;

/**
 * Status filters as links: each is a real href — it opens in a new tab and can
 * be crawled — and a plain click changes the list in place.
 */
export function StatusChips({ list }: { list: ListStateHandle<typeof articleList> }) {
  return (
    <nav aria-label="Status">
      {CHIPS.map(({ label, status }) => (
        <a
          aria-current={list.state.status === status ? 'true' : undefined}
          href={list.href({ status })}
          key={label}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            if (!isPlainClick(event)) {
              return;
            }

            event.preventDefault();
            list.set({ status });
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
