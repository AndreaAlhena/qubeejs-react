import type { ReactElement } from 'react';

import { buildListRequest, readListState } from '@qubeejs/core';
import { fetchQubeePage } from '@qubeejs/react/fetch';

import { type Task, taskList } from '../../../../lib/task-list';
import { TasksView } from './tasks-view';

type TasksPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * A Server Component: the list's state comes from the query and its input, the project, from the
 * route path. It fetches the page with the server-safe `fetch` entry and hands it to the Client
 * Component as `initialData`.
 */
export default async function TasksPage({
  params,
  searchParams,
}: TasksPageProps): Promise<ReactElement> {
  const request = buildListRequest(taskList, readListState(taskList, await searchParams), {
    projectId: (await params).id,
  });
  const initialData = await fetchQubeePage<Task>(request);

  return (
    <main>
      <h1>Tasks</h1>
      <p>
        Server request: <output id="server-uri">{request.uri}</output>
      </p>
      <TasksView initialData={initialData} />
    </main>
  );
}
