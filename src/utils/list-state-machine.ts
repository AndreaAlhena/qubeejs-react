import type { ListStateMachine } from '../types/list-state-machine.type';

/**
 * A machine with nothing pending, at `location`.
 *
 * @param location - The current URL
 * @returns The settled machine
 */
export function createListStateMachine(location: string): ListStateMachine {
  return { debouncing: false, draft: null, inflight: [], location };
}

/**
 * Hold `href` as the draft while a debounce waits to commit it.
 *
 * @param machine - The current machine
 * @param href - The href the latest `set()` produced
 * @returns The machine, debouncing
 */
export function draftLocation(machine: ListStateMachine, href: string): ListStateMachine {
  return { ...machine, debouncing: true, draft: href };
}

/**
 * Drop the draft a debounce was holding, because the debounce will never commit it.
 *
 * The draft falls back to the last href in flight, or to nothing when none is: the state reads the
 * URL again instead of showing text that will never reach it.
 *
 * @param machine - The current machine
 * @returns The same machine when nothing is debouncing, otherwise the machine without the draft
 */
export function cancelDraft(machine: ListStateMachine): ListStateMachine {
  if (!machine.debouncing) {
    return machine;
  }

  return { ...machine, debouncing: false, draft: machine.inflight.at(-1) ?? null };
}

/**
 * Record that `href` is being navigated to.
 *
 * Committing the URL the page is already on settles the machine: whatever was in flight has been
 * superseded, and the caller navigates only if something was.
 *
 * @param machine - The current machine
 * @param href - The href handed to `navigate()`
 * @returns The machine, with `href` in flight and as the draft
 */
export function commitLocation(machine: ListStateMachine, href: string): ListStateMachine {
  if (href === machine.location) {
    return { ...machine, debouncing: false, draft: null, inflight: [] };
  }

  return { ...machine, debouncing: false, draft: href, inflight: [...machine.inflight, href] };
}

/**
 * Reconcile the machine with the URL the router reports.
 *
 * A URL the machine navigated to drops its last occurrence and everything older from the in-flight
 * list, so a router that cancels superseded navigations and lands only the last one still settles.
 * The draft settles once nothing is pending. Any other URL — Back, Forward, a link elsewhere —
 * wins: the machine resets to it.
 *
 * @param machine - The current machine
 * @param location - The URL the router reports
 * @returns The same machine when nothing changed, otherwise the reconciled one
 */
export function observeLocation(machine: ListStateMachine, location: string): ListStateMachine {
  if (location === machine.location) {
    return machine;
  }

  const at = machine.inflight.lastIndexOf(location);

  if (at === -1) {
    return createListStateMachine(location);
  }

  const inflight = machine.inflight.slice(at + 1);
  const isSettled = inflight.length === 0 && !machine.debouncing;

  return { ...machine, draft: isSettled ? null : machine.draft, inflight, location };
}
