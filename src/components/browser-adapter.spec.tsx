import type { ReactElement } from 'react';

import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { articleList } from '../../test/fixtures/article-list';
import { useQubeeList } from '../hooks/use-qubee-list';
import { BrowserAdapter } from './browser-adapter';

function Pager(): ReactElement {
  const list = useQubeeList(articleList);

  return (
    <button onClick={() => list.setPage(list.state.page + 1)} type="button">
      next from {list.state.page}
    </button>
  );
}

function PageLabel(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output>page {state.page}</output>;
}

describe('BrowserAdapter', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/articles?page=2');
  });

  it('should give the lists below it the browser location', () => {
    render(
      <StrictMode>
        <BrowserAdapter>
          <PageLabel />
        </BrowserAdapter>
      </StrictMode>
    );

    expect(screen.getByRole('status').textContent).toBe('page 2');
  });

  it('should navigate through browser history and keep every list in sync', () => {
    render(
      <BrowserAdapter>
        <Pager />
        <PageLabel />
      </BrowserAdapter>
    );

    act(() => screen.getByRole('button').click());

    expect(window.location.search).toBe('?page=3');
    expect(screen.getByRole('status').textContent).toBe('page 3');
  });

  it('should render on the server with an empty location', () => {
    const html = renderToString(
      <BrowserAdapter>
        <PageLabel />
      </BrowserAdapter>
    );

    expect(html).toContain('page <!-- -->1');
  });
});
