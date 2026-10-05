import type { Task } from './task-list';

/** The projects behind `/api/tasks`. */
const PROJECTS = ['7', '42'];

/** How many tasks each project holds: odd ones open, even ones done. */
const TASKS_PER_PROJECT = 12;

/**
 * The tasks behind `/api/tasks`: "Project 42 · Task 01" is the first task of project 42, so a
 * row says which project and which page it comes from.
 */
export const tasks: readonly Task[] = PROJECTS.flatMap((project, projectIndex) =>
  Array.from({ length: TASKS_PER_PROJECT }, (_, index) => ({
    id: projectIndex * TASKS_PER_PROJECT + index + 1,
    project,
    status: index % 2 === 0 ? ('open' as const) : ('done' as const),
    title: `Project ${project} · Task ${String(index + 1).padStart(2, '0')}`,
  }))
);
