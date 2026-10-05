import { MemoryAdapter, QubeeFetchProvider } from '@qubeejs/react';
import type { QubeeFetcher } from '@qubeejs/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProjectTasks } from './project-tasks';

/** A Strapi page holding one task. */
const ONE_TASK = {
  data: [{ id: 1, status: 'open', title: 'Write the docs' }],
  meta: { pagination: { page: 1, pageCount: 1, pageSize: 25, total: 1 } },
};

/** The tasks, in memory instead of the URL, with the fetcher the test controls. */
function Harness({ fetcher, projectId }: { fetcher: QubeeFetcher; projectId?: string }) {
  return (
    <MemoryAdapter>
      <QubeeFetchProvider fetcher={fetcher}>
        <ProjectTasks projectId={projectId} />
      </QubeeFetchProvider>
    </MemoryAdapter>
  );
}

describe('ProjectTasks', () => {
  it('should wait for the project, and fetch nothing meanwhile', () => {
    const fetcher = vi.fn<QubeeFetcher>();

    render(<Harness fetcher={fetcher} />);

    expect(screen.getByRole('status').textContent).toBe('Finding the project…');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should fetch the tasks of the project once it is known', async () => {
    const fetcher = vi.fn<QubeeFetcher>(() =>
      Promise.resolve(new Response(JSON.stringify(ONE_TASK)))
    );
    const { rerender } = render(<Harness fetcher={fetcher} />);

    rerender(<Harness fetcher={fetcher} projectId="42" />);

    expect((await screen.findByText('Write the docs')).tagName).toBe('LI');
    expect(decodeURIComponent(fetcher.mock.calls[0][0])).toContain('filters[project][$eq]=42');
  });
});
