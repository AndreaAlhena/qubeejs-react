import type { ReactElement } from 'react';

import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { articleList } from '../../test/fixtures/article-list';
import { useQubeeList } from '../hooks/use-qubee-list';
import { BrowserAdapter } from './browser-adapter';
import { MemoryAdapter } from './memory-adapter';

function Pager({ name }: { name: string }): ReactElement {
  const list = useQubeeList(articleList);

  return (
    <button onClick={() => list.setPage(list.state.page + 1)} type="button">
      {name} next
    </button>
  );
}

function PageLabel({ name }: { name: string }): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output data-testid={name}>{state.page}</output>;
}

describe('MemoryAdapter', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/somewhere?page=9');
  });

  it('should share one state between the lists below it, away from the page URL', () => {
    render(
      <StrictMode>
        <MemoryAdapter>
          <Pager name="dialog" />
          <PageLabel name="label" />
        </MemoryAdapter>
      </StrictMode>
    );

    act(() => screen.getByRole('button').click());

    expect(screen.getByTestId('label').textContent).toBe('2');
    expect(window.location.search).toBe('?page=9');
  });

  it('should start from the initial search', () => {
    render(
      <MemoryAdapter initialSearch="page=5">
        <PageLabel name="label" />
      </MemoryAdapter>
    );

    expect(screen.getByTestId('label').textContent).toBe('5');
  });

  it('should keep its state when the initial search changes later', () => {
    const { rerender } = render(
      <MemoryAdapter initialSearch="page=5">
        <PageLabel name="label" />
      </MemoryAdapter>
    );

    rerender(
      <MemoryAdapter initialSearch="page=8">
        <PageLabel name="label" />
      </MemoryAdapter>
    );

    expect(screen.getByTestId('label').textContent).toBe('5');
  });

  it('should keep two providers apart', () => {
    render(
      <>
        <MemoryAdapter>
          <Pager name="first" />
          <PageLabel name="first-label" />
        </MemoryAdapter>
        <MemoryAdapter>
          <PageLabel name="second-label" />
        </MemoryAdapter>
      </>
    );

    act(() => screen.getByRole('button', { name: 'first next' }).click());

    expect(screen.getByTestId('first-label').textContent).toBe('2');
    expect(screen.getByTestId('second-label').textContent).toBe('1');
  });

  it('should keep its lists apart from the same list under an outer provider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <BrowserAdapter>
        <PageLabel name="page-label" />
        <MemoryAdapter initialSearch="page=5">
          <Pager name="dialog" />
          <PageLabel name="dialog-label" />
        </MemoryAdapter>
      </BrowserAdapter>
    );

    act(() => screen.getByRole('button').click());

    expect(screen.getByTestId('dialog-label').textContent).toBe('6');
    expect(screen.getByTestId('page-label').textContent).toBe('9');
    expect(window.location.search).toBe('?page=9');
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('should render the initial search on the server', () => {
    const html = renderToString(
      <MemoryAdapter initialSearch="page=5">
        <PageLabel name="label" />
      </MemoryAdapter>
    );

    expect(html).toContain('>5<');
  });
});
