import { buildListRequest, readListState } from '@qubeejs/core';
import { fetchQubeePage } from '@qubeejs/react/fetch';

import { type Task, taskList } from '@/projects/task-list';

import { ProjectTasksView } from './project-tasks-view';

type ProjectTasksPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** /projects/[id]/tasks, rendered on the server: the state from the query, the project from the path. */
export default async function ProjectTasksPage({ params, searchParams }: ProjectTasksPageProps) {
  const request = buildListRequest(taskList, readListState(taskList, await searchParams), {
    projectId: (await params).id,
  });
  const result = await fetchQubeePage<Task>(request);

  return <ProjectTasksView result={result} />;
}
