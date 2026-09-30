import { getPageWindow } from '@qubeejs/core';
import type { ListStateHandle } from '@qubeejs/react';
import type { MouseEvent } from 'react';

import type { articleList } from './article-list';
import { isPlainClick } from './plain-click';

type PaginationBarProps = {
  /** The last page the API reported; 1 until the first page arrives. */
  lastPage: number;
  list: ListStateHandle<typeof articleList>;
};

/** Previous, the page window with its gaps, and next — every page a real link. */
export function PaginationBar({ lastPage, list }: PaginationBarProps) {
  const { page } = list.state;

  /** Navigate in place on a plain click; leave any other click to the browser. */
  const goTo = (target: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) {
      return;
    }

    event.preventDefault();
    list.setPage(target);
  };

  return (
    <nav aria-label="Pagination">
      <ul>
        <li>
          {page > 1 ? (
            <a aria-label="Previous page" href={list.href({ page: page - 1 })} onClick={goTo(page - 1)}>
              ‹
            </a>
          ) : (
            <span aria-hidden="true">‹</span>
          )}
        </li>
        {getPageWindow(page, lastPage).map((item, index) => (
          <li key={item === 'gap' ? `gap-${index}` : item}>
            {item === 'gap' ? (
              <span aria-hidden="true">…</span>
            ) : (
              <a
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                href={list.href({ page: item })}
                onClick={goTo(item)}
              >
                {item}
              </a>
            )}
          </li>
        ))}
        <li>
          {page < lastPage ? (
            <a aria-label="Next page" href={list.href({ page: page + 1 })} onClick={goTo(page + 1)}>
              ›
            </a>
          ) : (
            <span aria-hidden="true">›</span>
          )}
        </li>
      </ul>
    </nav>
  );
}
