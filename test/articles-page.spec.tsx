import type { RawResponse } from '@qubeejs/core';
import type { ReactElement } from 'react';

import { getAriaSort, getPageWindow } from '@qubeejs/core';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useEffect, useState } from 'react';

import { useBrowserAdapter } from '../src/hooks/use-browser-adapter';
import { useQubeeList } from '../src/hooks/use-qubee-list';
import { articleList } from './fixtures/article-list';
import { ArticleStatusEnum } from './fixtures/article-status.enum';
import { uriFor } from './helpers/uri-for';

type ArticleRow = { id: number; title: string };

const STRAPI_PAGE = {
  data: [
    { id: 1, title: 'Hooks in depth' },
    { id: 2, title: 'Server rendering' },
  ],
  meta: { pagination: { page: 1, pageCount: 3, pageSize: 20, total: 57 } },
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function ArticlesPage(): ReactElement {
  const list = useQubeeList(articleList, useBrowserAdapter());
  const [rows, setRows] = useState<readonly ArticleRow[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const { request } = list;

  useEffect(() => {
    let isCurrent = true;

    void fetch(request.uri)
      .then((response) => response.json() as Promise<RawResponse>)
      .then((body) => {
        if (!isCurrent) {
          return;
        }

        const page = request.paginate<ArticleRow>(body).toPlain();

        setRows(page.data);
        setLastPage(page.lastPage ?? 1);
      });

    return (): void => {
      isCurrent = false;
    };
  }, [request]);

  return (
    <main>
      <input
        aria-label="Search"
        onChange={(event) => list.set({ q: event.target.value }, { debounce: 300, replace: true })}
        value={list.state.q ?? ''}
      />
      <button onClick={() => list.set({ status: ArticleStatusEnum.PUBLISHED })} type="button">
        Published
      </button>
      <table>
        <thead>
          <tr>
            <th aria-sort={getAriaSort(list.state.sort, 'title')}>
              <button onClick={() => list.toggleSort('title')} type="button">
                Title
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav aria-label="Pages">
        {getPageWindow(list.state.page, lastPage).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`}>…</span>
          ) : (
            <a
              aria-current={item === list.state.page ? 'page' : undefined}
              href={list.href({ page: item })}
              key={item}
              onClick={(event) => {
                event.preventDefault();
                list.setPage(item);
              }}
            >
              {item}
            </a>
          )
        )}
      </nav>
      <p data-testid="status">{list.isPending ? 'Loading' : 'Ready'}</p>
    </main>
  );
}

describe('an articles page', () => {
  const fetchMock = vi.fn((_uri: string): Promise<Response> =>
    Promise.resolve(new Response(JSON.stringify(STRAPI_PAGE)))
  );

  beforeEach(() => {
    fetchMock.mockClear();
    window.history.replaceState(null, '', '/articles');
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch the first page and render its rows and pages', async () => {
    render(
      <StrictMode>
        <ArticlesPage />
      </StrictMode>
    );

    expect(await screen.findByText('Hooks in depth')).toBeTruthy();
    expect(fetchMock).toHaveBeenLastCalledWith(uriFor(''));
    expect(screen.getByRole('link', { name: '2' }).getAttribute('href')).toBe('/articles?page=2');
    expect(screen.getByRole('link', { name: '3' })).toBeTruthy();
  });

  it('should debounce the search into one navigation and one request', async () => {
    render(
      <StrictMode>
        <ArticlesPage />
      </StrictMode>
    );
    await screen.findByText('Hooks in depth');
    const calls = fetchMock.mock.calls.length;
    const historyLength = window.history.length;

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'react' },
    });

    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Search' }).value).toBe('react');
    expect(screen.getByTestId('status').textContent).toBe('Loading');
    expect(window.location.search).toBe('');
    expect(fetchMock.mock.calls.length).toBe(calls);

    await act(() => wait(350));

    expect(window.location.search).toBe('?q=react');
    expect(window.history.length).toBe(historyLength);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(uriFor('q=react'));
    });
    expect(screen.getByTestId('status').textContent).toBe('Ready');
  });

  it('should filter, sort and page through the URL', async () => {
    render(
      <StrictMode>
        <ArticlesPage />
      </StrictMode>
    );
    await screen.findByText('Hooks in depth');

    fireEvent.click(screen.getByRole('button', { name: 'Published' }));

    expect(window.location.search).toBe('?status=published');

    fireEvent.click(screen.getByRole('button', { name: 'Title' }));

    expect(window.location.search).toBe('?status=published&sort=title');
    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('ascending');

    fireEvent.click(await screen.findByRole('link', { name: '2' }));

    expect(window.location.search).toBe('?page=2&status=published&sort=title');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(uriFor('page=2&status=published&sort=title'));
    });
  });
});
