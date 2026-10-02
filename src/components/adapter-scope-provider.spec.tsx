import type { ReactElement } from 'react';

import { render, screen } from '@testing-library/react';

import { articleList } from '../../test/fixtures/article-list';
import { createTestRouter } from '../../test/helpers/create-test-router';
import { useQubeeList } from '../hooks/use-qubee-list';
import { AdapterScopeProvider } from './adapter-scope-provider';

function PageLabel(): ReactElement {
  const { state } = useQubeeList(articleList);

  return <output>page {state.page}</output>;
}

describe('AdapterScopeProvider', () => {
  it('should hand its adapter hook to the lists below', () => {
    render(
      <AdapterScopeProvider useAdapter={createTestRouter('/articles?page=4').useRouter}>
        <PageLabel />
      </AdapterScopeProvider>
    );

    expect(screen.getByRole('status').textContent).toBe('page 4');
  });

  it('should keep the adapter hook it was first rendered with', () => {
    const first = createTestRouter('/articles?page=4');
    const second = createTestRouter('/articles?page=9');
    const { rerender } = render(
      <AdapterScopeProvider useAdapter={first.useRouter}>
        <PageLabel />
      </AdapterScopeProvider>
    );

    rerender(
      <AdapterScopeProvider useAdapter={second.useRouter}>
        <PageLabel />
      </AdapterScopeProvider>
    );

    expect(screen.getByRole('status').textContent).toBe('page 4');
  });
});
