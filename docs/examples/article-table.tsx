import type { ListStateHandle } from '@qubeejs/react';

import type { Article, articleList } from './article-list';
import { SortHeader } from './sort-header';

type ArticleTableProps = {
  articles: readonly Article[];
  list: ListStateHandle<typeof articleList>;
};

/** How the table prints a publication date. */
const DATE_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

/** The articles on this page, under headers that sort the list. */
export function ArticleTable({ articles, list }: ArticleTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <SortHeader field="title" list={list}>
            Title
          </SortHeader>
          <SortHeader field="publishedAt" list={list}>
            Published
          </SortHeader>
        </tr>
      </thead>
      <tbody>
        {articles.map((article) => (
          <tr key={article.id}>
            <td>{article.title}</td>
            <td>{DATE_FORMAT.format(new Date(article.publishedAt))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
