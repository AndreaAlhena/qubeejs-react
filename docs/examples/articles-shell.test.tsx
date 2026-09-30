import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';
import { QubeeProvider } from '@qubeejs/react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Pager, StatusFilter } from './articles-shell';

/** Render under a provider holding an instance the test can inspect. */
function renderWithQubee(children: ReactNode) {
  const qubee = createQubee({ driver: STRAPI_DRIVER });

  render(<QubeeProvider value={qubee}>{children}</QubeeProvider>);

  return qubee;
}

describe('StatusFilter', () => {
  it('should narrow the shared query to published articles', () => {
    const qubee = renderWithQubee(<StatusFilter />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Published only' }));

    expect(qubee.store.getSnapshot().filters['status']).toEqual(['published']);
  });

  it('should go back to page 1 when the filter changes', () => {
    const qubee = renderWithQubee(<StatusFilter />);

    qubee.builder.setPage(3);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Published only' }));

    expect(qubee.store.getSnapshot().page).toBe(1);
  });
});

describe('Pager', () => {
  it('should disable Previous on the first page', () => {
    renderWithQubee(<Pager />);

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous' }).disabled).toBe(true);
  });

  it('should re-render when the shared instance moves on', () => {
    renderWithQubee(<Pager />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Page 2')).toBeTruthy();
  });
});
