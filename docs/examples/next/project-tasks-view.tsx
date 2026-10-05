'use client';

import type { PaginatedResult } from '@qubeejs/core';
import { useQubeeList } from '@qubeejs/react';
import { useParams } from 'next/navigation';

import { type Task, taskList } from '@/projects/task-list';

type ProjectTasksViewProps = {
  result: PaginatedResult<Task>;
};

/**
 * The interactive half of /projects/[id]/tasks: the status filter, and the page the server
 * fetched. The project comes from the route path through `useParams()` and goes to the list as
 * its input — never into the URL, which keeps only the page and the status.
 */
export function ProjectTasksView({ result }: ProjectTasksViewProps) {
  const { id } = useParams<{ id: string }>();
  const list = useQubeeList(taskList, { projectId: id });

  return (
    <section aria-busy={list.isPending}>
      <button onClick={() => list.set({ status: 'open' })} type="button">
        Open
      </button>
      <button onClick={() => list.set({ status: 'done' })} type="button">
        Done
      </button>
      <button onClick={() => list.set({ status: undefined })} type="button">
        All
      </button>
      <ul>
        {result.data.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </section>
  );
}
