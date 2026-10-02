import { useQubeeList } from '@qubeejs/react';

import { articleList } from './article-list';

/** Previous and next links for the articles list. It names no router: the provider supplies it. */
export function ArticlePager() {
  const list = useQubeeList(articleList);
  const { page } = list.state;

  return (
    <nav aria-label="Pagination">
      {page > 1 && <a href={list.href({ page: page - 1 })}>Previous</a>}
      <a href={list.href({ page: page + 1 })}>Next</a>
    </nav>
  );
}
