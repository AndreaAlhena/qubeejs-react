import { useQubeeList } from '@qubeejs/react';
import type { RouterAdapter } from '@qubeejs/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { articleList } from './article-list';
import { ArticleSearch } from './article-search';

/** The search box, wired to the article list and to a router the test controls. */
function Harness({ router }: { router: RouterAdapter }) {
  return <ArticleSearch list={useQubeeList(articleList, router)} />;
}

/** Render the box at /articles, with the given query string (none by default). */
function renderSearch(search = '') {
  const navigate = vi.fn<RouterAdapter['navigate']>();

  render(<Harness router={{ navigate, pathname: '/articles', search }} />);

  return {
    input: screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search articles' }),
    navigate,
  };
}

describe('ArticleSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should keep the space the user just typed', () => {
    const { input } = renderSearch();

    fireEvent.change(input, { target: { value: 'hello ' } });

    expect(input.value).toBe('hello ');
  });

  it('should navigate once, 300 ms after the last keystroke', () => {
    const { input, navigate } = renderSearch();

    fireEvent.change(input, { target: { value: 're' } });
    fireEvent.change(input, { target: { value: 'react' } });

    expect(input.value).toBe('react');
    expect(navigate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/articles?q=react', { replace: true });
  });

  it('should clear at once, taking the waiting change with it', () => {
    const { input, navigate } = renderSearch('?q=old');

    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/articles', { replace: false });
    expect(input.value).toBe('');
  });
});
