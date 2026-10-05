import type {
  ListDefinition,
  ListLocation,
  ListParams,
  Sort,
  ToggleSortOptions,
} from '@qubeejs/core';

import { buildListHref, readListState, toggleSort } from '@qubeejs/core';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';

import type { ListSetOptions } from '../types/list-set-options.type';
import type { ListStateMachine } from '../types/list-state-machine.type';
import type { LooseChanges } from '../types/loose-changes.type';
import type { LooseList } from '../types/loose-list.type';
import type { QubeeListArgs } from '../types/qubee-list-args.type';
import type { QubeeListHandle } from '../types/qubee-list-handle.type';
import type { WideList } from '../types/wide-list.type';

import { buildRequestFor } from '../utils/build-request-for';
import { createDebouncer } from '../utils/create-debouncer';
import { createLocalStore } from '../utils/create-local-store';
import { normalizeHref, pathnameOfHref, searchOfHref } from '../utils/href';
import { isRouterAdapter } from '../utils/is-router-adapter';
import {
  cancelDraft,
  commitLocation,
  createListStateMachine,
  draftLocation,
  observeLocation,
} from '../utils/list-state-machine';
import { useRouterAdapter } from './use-router-adapter';
import { useStableRequest } from './use-stable-request';

/**
 * The key of the list's one `sortParam`, or `undefined` when it has none or several.
 *
 * @param list - The list
 * @returns The key, e.g. `sort`
 */
function findSortKey(list: LooseList): string | undefined {
  const keys = Object.keys(list.params).filter((key) => 'sortFields' in list.params[key]);

  return keys.length === 1 ? keys[0] : undefined;
}

/**
 * The router's location as one comparable string: the href core would build for it, normalised.
 *
 * Going through `buildListHref` puts the query in the order core writes it, so a router that
 * reorders or re-encodes the query still compares equal to the href the hook navigated to.
 *
 * @param list - The list the location belongs to
 * @param location - The router, or the pathname and query of an href
 * @returns e.g. `/articles?page=2&q=react`
 */
function locationOf(list: LooseList, location: ListLocation): string {
  return normalizeHref(buildListHref(list, location));
}

/**
 * Drive a declared list: its state lives in the page URL, or wherever its router adapter keeps it.
 *
 * `state` updates synchronously on every `set()`, so a controlled input never lags behind a
 * debounce; `request` follows the committed state, so a cache key built from it changes once per
 * navigation, never per keystroke; the URL stays the source of truth — a change the hook did not
 * cause (Back, Forward, a link elsewhere) cancels a pending debounce and discards anything not
 * yet in the URL. Unmounting (or hiding the tree with `<Activity>`) cancels a pending debounce and
 * drops its draft too. A click on a link while a debounce waits commits it at once, so the link
 * the user follows is never overtaken by it. `toggleSort` is there when the list declares exactly
 * one `sortParam`.
 *
 * A list that declares an input — what its request needs besides URL state, such as a project id
 * from the route path — takes it after the list: `useQubeeList(taskList, { projectId })`. The input
 * goes into `request` and never into the URL. `null` means it is not ready yet, a lookup still in
 * flight or a route param missing: `request` is then `null`, and the fetching hooks fetch nothing.
 * A new input object with the same values keeps the same `request`.
 *
 * The list reads and writes the URL through a router adapter: the one passed last, else the
 * nearest adapter provider's — {@link BrowserAdapter}, or the one for your router.
 *
 * @param list - A list declared once with `defineList`, as a module-level constant
 * @param args - `[adapter?]` for a list without an input, `[input, adapter?]` for a list that
 * declares one — see {@link QubeeListArgs}. The adapter takes the place of the nearest provider's:
 * the current location and a `navigate`, rebuilt every render. An input must not be an object
 * with a function `navigate`: with one argument after the list, that is read as the adapter.
 * @returns The state, request, pending flag, and the functions that change them
 * @throws {MissingRouterAdapterError} When no adapter is passed and no adapter provider is above
 *
 * @example
 * ```tsx
 * const list = useQubeeList(articleList);
 *
 * <input value={list.state.q ?? ''} onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })} />
 * <th aria-sort={getAriaSort(list.state.sort, 'title')} onClick={() => list.toggleSort('title')}>Title</th>
 * <a href={list.href({ page: 2 })}>2</a>
 * ```
 *
 * @example
 * ```tsx
 * // /projects/42/tasks?status=open — the project comes from the path, the rest from the query
 * const { projectId } = useParams<{ projectId: string }>();
 * const tasks = useQubeeList(taskList, projectId ? { projectId } : null);
 * ```
 */
export function useQubeeList<TList extends ListDefinition<ListParams, NonNullable<unknown>>>(
  list: TList,
  ...args: QubeeListArgs<TList>
): QubeeListHandle<TList> {
  // `QubeeListHandle<TList>` is built on `ListState<TList>`, a conditional type the compiler
  // cannot evaluate while `TList` is generic. The hook works on the list as a `LooseList` —
  // which every definition is — and narrows the handle once, where it returns it. It holds the
  // list as a `WideList` too, to pass it an input.
  const loose: LooseList = list;
  const wide: WideList = list;
  const [first, second] = args;
  const input = isRouterAdapter(first) ? undefined : first;
  const router = useRouterAdapter(loose, isRouterAdapter(first) ? first : second);
  const location = locationOf(loose, router);
  const [machine] = useState(() => createLocalStore(createListStateMachine(location)));
  const [debouncer] = useState(createDebouncer);
  const snapshot = useSyncExternalStore(
    machine.subscribe,
    machine.getSnapshot,
    machine.getSnapshot
  );
  const view = observeLocation(snapshot, location);
  const [isNavigating, startTransition] = useTransition();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    const before = machine.getSnapshot();
    const after = observeLocation(before, location);

    if (before.debouncing && !after.debouncing) {
      debouncer.cancel();
    }

    machine.update(() => after);
  }, [debouncer, location, machine]);

  // While a debounced change waits, a click on a link commits it at once. With a router that
  // reports the new URL only after its transition, a change that fired after the click would
  // navigate back to this list and pull the user away from where they were going. Committed
  // first, it is simply what they leave behind. Other clicks are left alone: a button that changes
  // the same list merges with the waiting change, in one navigation.
  useEffect(() => {
    if (!view.debouncing) {
      return undefined;
    }

    const flushOnLink = (event: MouseEvent): void => {
      // The composed path, not `target.closest()`: for a link inside a shadow root, the target a
      // listener on the document sees is the root's host.
      const isOnLink = event
        .composedPath()
        .some((node) => node instanceof Element && node.matches('a[href]'));

      if (isOnLink) {
        debouncer.flush();
      }
    };

    document.addEventListener('click', flushOnLink, true);

    return (): void => {
      document.removeEventListener('click', flushOnLink, true);
    };
  }, [debouncer, view.debouncing]);

  // Not only an unmount: `<Activity>` hiding the tree and Fast Refresh tear effects down and re-run
  // them, and a debounce cancelled there would otherwise leave its draft — and `isPending` — behind.
  useEffect(
    () => (): void => {
      debouncer.cancel();
      machine.update(cancelDraft);
    },
    [debouncer, machine]
  );

  const read = useCallback(
    (): ListStateMachine =>
      observeLocation(machine.getSnapshot(), locationOf(loose, routerRef.current)),
    [loose, machine]
  );

  const commit = useCallback(
    (href: string, replace: boolean): void => {
      // The machine compares canonical locations, as observed ones are; the router gets the href
      // as core built it.
      const current = read();
      const target = locationOf(loose, {
        pathname: pathnameOfHref(href),
        search: searchOfHref(href),
      });

      machine.update(() => commitLocation(current, target));

      if (target === current.location && current.inflight.length === 0) {
        return;
      }

      startTransition(() => {
        routerRef.current.navigate(href, { replace });
      });
    },
    [loose, machine, read]
  );

  const set = useCallback(
    (changes: LooseChanges, options: ListSetOptions = {}): void => {
      const { debounce = 0, replace = false } = options;
      const current = read();
      const href = buildListHref(
        loose,
        {
          pathname: routerRef.current.pathname,
          search: searchOfHref(current.draft ?? current.location),
        },
        changes
      );

      debouncer.cancel();

      if (debounce <= 0) {
        commit(href, replace);

        return;
      }

      machine.update(() =>
        draftLocation(
          current,
          locationOf(loose, { pathname: pathnameOfHref(href), search: searchOfHref(href) })
        )
      );
      debouncer.schedule(() => commit(href, replace), debounce);
    },
    [commit, debouncer, loose, machine, read]
  );

  const reset = useCallback(
    (options: Omit<ListSetOptions, 'debounce'> = {}): void => {
      set(Object.fromEntries(Object.keys(loose.params).map((key) => [key, undefined])), options);
    },
    [loose, set]
  );

  const setPage = useCallback(
    (page: number, options: Omit<ListSetOptions, 'debounce'> = {}): void => {
      set({ page }, options);
    },
    [set]
  );

  const draftSearch = searchOfHref(view.draft ?? view.location);
  const committedSearch = searchOfHref(view.inflight.at(-1) ?? view.location);
  const isPending = isNavigating || view.debouncing || view.inflight.length > 0;
  const sortKey = useMemo(() => findSortKey(loose), [loose]);
  const state = useMemo(() => readListState(loose, draftSearch), [draftSearch, loose]);
  const built = useMemo(
    () => buildRequestFor(loose, wide, committedSearch, input),
    [committedSearch, input, loose, wide]
  );
  const request = useStableRequest(loose, built);
  const href = useCallback(
    (changes: LooseChanges = {}): string =>
      buildListHref(loose, { pathname: router.pathname, search: draftSearch }, changes),
    [draftSearch, loose, router.pathname]
  );

  return useMemo(() => {
    const sortMember =
      sortKey === undefined
        ? {}
        : {
            toggleSort: (field: string, options: ListSetOptions & ToggleSortOptions = {}): void => {
              const { multiple, ...setOptions } = options;
              const current = read();
              const search = searchOfHref(current.draft ?? current.location);
              // `sortKey` names a sortParam, whose value is always a Sort array; `readListState`
              // types it `unknown` because the loose list indexes its params by `string`.
              const sorts = readListState(loose, search)[sortKey] as readonly Sort[];
              const changes: LooseChanges = { [sortKey]: toggleSort(sorts, field, { multiple }) };

              set(changes, setOptions);
            },
          };

    return {
      href,
      isPending,
      request,
      reset,
      set,
      setPage,
      state,
      ...sortMember,
    } as unknown as QubeeListHandle<TList>;
  }, [href, isPending, loose, read, request, reset, set, setPage, sortKey, state]);
}
