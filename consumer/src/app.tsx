// The README's usage samples, as a user would type them, plus a few outputs to assert on.
import type { ReactElement } from 'react';

import { getAriaSort, STRAPI_DRIVER } from '@qubeejs/core';
import {
  BrowserAdapter,
  QubeeProvider,
  useBrowserAdapter,
  useQubeeList,
  useQubee,
  useQubeeContext,
} from '@qubeejs/react';

import { articleList, tagList } from './article-list.js';

export function ArticlePicker(): ReactElement {
  const { builder, state } = useQubee({
    baseUrl: 'https://example.com/api',
    driver: STRAPI_DRIVER,
  });

  return (
    <button id="picker" onClick={() => builder.nextPage()}>
      Page {state.page}
    </button>
  );
}

function ArticleFilters(): ReactElement {
  const { builder } = useQubeeContext();

  return (
    <button id="filter" onClick={() => builder.addFilter('status', 'published')}>
      Published
    </button>
  );
}

function ArticleTable(): ReactElement {
  const { state } = useQubeeContext();

  return <output id="shared">{JSON.stringify(state)}</output>;
}

export function Shared(): ReactElement {
  return (
    <QubeeProvider baseUrl="https://example.com/api" driver={STRAPI_DRIVER}>
      <ArticleFilters />
      <ArticleTable />
    </QubeeProvider>
  );
}

export function Orphan(): ReactElement {
  const { state } = useQubeeContext();

  return <output>{state.page}</output>;
}

export function Articles(): ReactElement {
  const list = useQubeeList(articleList, useBrowserAdapter());

  return (
    <>
      <input
        id="q"
        value={list.state.q ?? ''}
        onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })}
      />
      <button id="clear" onClick={() => list.set({ q: undefined, status: undefined })}>
        Clear filters
      </button>
      <table>
        <thead>
          <tr>
            <th id="th" aria-sort={getAriaSort(list.state.sort, 'title')}>
              <button id="sort" onClick={() => list.toggleSort('title')} type="button">
                Title
              </button>
            </th>
          </tr>
        </thead>
      </table>
      <a id="link" href={list.href({ page: 2 })}>
        2
      </a>
      <button id="page2" onClick={() => list.setPage(2)} type="button">
        Go to page 2
      </button>
      <output id="uri">{list.request.uri}</output>
      <output id="pending">{String(list.isPending)}</output>
      <output id="state">{JSON.stringify(list.state)}</output>
    </>
  );
}

/**
 * A second, independent reader of the same URL. It takes its adapter from the provider, while
 * <Articles> passes its own: both must stay in sync.
 */
export function PageLabel(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output id="label">{state.page}</output>;
}

/** A second list on the same page, with its own param names. */
export function Tags(): ReactElement {
  const tags = useQubeeList(tagList, useBrowserAdapter());

  return (
    <button id="tagnext" onClick={() => tags.setPage(tags.state.page + 1)} type="button">
      Tags page {tags.state.page}
    </button>
  );
}

/** A list with neither a provider above it nor an adapter passed in. */
export function NoAdapter(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output>{state.page}</output>;
}

export function App(): ReactElement {
  return (
    <BrowserAdapter>
      <ArticlePicker />
      <Shared />
      <Articles />
      <PageLabel />
      <Tags />
    </BrowserAdapter>
  );
}
