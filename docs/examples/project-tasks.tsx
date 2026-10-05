import { useQubeeList, useQubeeQuery } from '@qubeejs/react';

import { type Task, taskList } from './task-list';

type ProjectTasksProps = {
  /** The project's id once your lookup of its slug has answered; `undefined` until then. */
  projectId: string | undefined;
};

/**
 * The tasks of a project whose id is still being looked up. Until it is known, the input is
 * `null`: the list has no request, and nothing is fetched.
 */
export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const list = useQubeeList(taskList, projectId ? { projectId } : null);
  const tasks = useQubeeQuery<Task>(list.request);

  if (list.request === null) {
    return <p role="status">Finding the project…</p>;
  }

  return (
    <ul aria-busy={list.isPending || tasks.isFetching}>
      {tasks.data?.data.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
