import { getPageRange, type PaginatedResult } from '@qubeejs/core';

import type { Article } from './article-list';

/** "21–40 of 57 articles" — or "21–40 articles" when the API reports no total. */
export function ResultRange({ result }: { result: PaginatedResult<Article> }) {
  const { from, to, total } = getPageRange(result);

  if (to === 0) {
    return <p role="status">No articles match.</p>;
  }

  return (
    <p role="status">
      {from === to ? from : `${from}–${to}`}
      {total === null ? ' articles' : ` of ${total} articles`}
    </p>
  );
}
