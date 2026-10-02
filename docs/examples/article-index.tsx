import { useQubeeList, useQubeeQuery } from '@qubeejs/react';

import { type Article, articleList } from './article-list';
import { ArticleSearch } from './article-search';
import { ArticleTable } from './article-table';
import { PaginationBar } from './pagination-bar';
import { ResultRange } from './result-range';
import { StatusChips } from './status-chips';

/**
 * The article list, whole. One useQubeeList serves every control, so the page
 * dims while the search box's change is pending, and while its page is fetched.
 */
export function ArticleIndex() {
  const list = useQubeeList(articleList);
  const { data: result, isFetching } = useQubeeQuery<Article>(list.request);

  return (
    <section>
      <ArticleSearch list={list} />
      <StatusChips list={list} />
      <div aria-busy={list.isPending || isFetching}>
        <ArticleTable articles={result?.data ?? []} list={list} />
        {result && <ResultRange result={result} />}
      </div>
      <PaginationBar lastPage={result?.lastPage ?? 1} list={list} />
    </section>
  );
}
