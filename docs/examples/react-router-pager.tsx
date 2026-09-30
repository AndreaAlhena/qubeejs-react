import { getPageWindow } from '@qubeejs/core';
import { useListState } from '@qubeejs/react';
import { Link } from 'react-router';

import { articleList } from './article-list';
import { useReactRouter } from './use-react-router';

/** Page links for the article list, as React Router links: in-place and crawlable. */
export function ArticlePager({ lastPage }: { lastPage: number }) {
  const list = useListState(articleList, useReactRouter());

  return (
    <nav aria-label="Pagination">
      {getPageWindow(list.state.page, lastPage).map((item, index) =>
        item === 'gap' ? (
          <span aria-hidden="true" key={`gap-${index}`}>
            …
          </span>
        ) : (
          <Link
            aria-current={item === list.state.page ? 'page' : undefined}
            key={item}
            to={list.href({ page: item })}
          >
            {item}
          </Link>
        )
      )}
    </nav>
  );
}
