'use client';

import type { PaginatedResult } from '@qubeejs/core';
import type { ReactElement } from 'react';

import { useQubeeList, useQubeeQuery } from '@qubeejs/react';
import { useParams } from 'next/navigation';

import { type Task, taskList } from '../../../../lib/task-list';

type TasksViewProps = {
  /** The page of the URL the server rendered. */
  initialData?: PaginatedResult<Task>;
};

/**
 * The interactive half: the project comes from the route path through `useParams()`, and goes to
 * the list as its input — never into the URL, which keeps only the page and the status.
 */
export function TasksView({ initialData }: TasksViewProps): ReactElement {
  const { id } = useParams<{ id: string }>();
  const list = useQubeeList(taskList, { projectId: id });
  const tasks = useQubeeQuery<Task>(list.request, { initialData });

  return (
    <section aria-busy={list.isPending}>
      <button id="status-open" onClick={() => list.set({ status: 'open' })} type="button">
        Open
      </button>
      <button id="status-done" onClick={() => list.set({ status: 'done' })} type="button">
        Done
      </button>
      <button id="next-button" onClick={() => list.setPage(list.state.page + 1)} type="button">
        Next page
      </button>
      <p>
        Client request: <output id="client-uri">{list.request?.uri}</output>
      </p>
      <ul aria-busy={tasks.isFetching} id="rows">
        {tasks.data?.data.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <p>
        Fetching: <output id="fetching">{String(tasks.isFetching)}</output>
      </p>
    </section>
  );
}
