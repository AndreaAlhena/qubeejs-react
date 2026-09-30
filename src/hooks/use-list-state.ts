import type { ListDefinition, ListLocation, ListParams, ListState } from '@qubeejs/core';

import { buildListHref, buildListRequest, readListState } from '@qubeejs/core';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';

import type { ListRouter } from '../types/list-router.type';
import type { ListStateHandle } from '../types/list-state-handle.type';
import type { ListStateMachine } from '../types/list-state-machine.type';
import type { SetOptions } from '../types/set-options.type';

import { createLocalStore } from '../utils/create-local-store';
import { normalizeHref, pathnameOfHref, searchOfHref } from '../utils/href';
import {
  commitLocation,
  createListStateMachine,
  observeLocation,
} from '../utils/list-state-machine';

/**
 * The hook's non-generic view of a list. See the cast at the top of {@link useListState}.
 */
type LooseList = ListDefinition<ListParams>;

/**
 * Changes to a {@link LooseList}'s state.
 */
type LooseChanges = Partial<ListState<LooseList>>;

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
 * Drive a list whose state lives in the page URL.
 *
 * `state` updates synchronously on every `set()`, so a controlled input never lags; `request`
 * follows the committed state, so a cache key built from it changes once per navigation; the
 * URL stays the source of truth — a change the hook did not cause (Back, Forward, a link
 * elsewhere) discards anything not yet in it.
 *
 * @param list - A list declared once with `defineList`, as a module-level constant
 * @param router - The current location and a `navigate`, rebuilt every render
 * @returns The state, request, pending flag, and the functions that change them
 *
 * @example
 * ```tsx
 * const list = useListState(articleList, useBrowserRouter());
 *
 * <input value={list.state.q ?? ''} onChange={(e) => list.set({ q: e.target.value }, { debounce: 300, replace: true })} />
 * ```
 */
export function useListState<TList extends ListDefinition<ListParams>>(
  list: TList,
  router: ListRouter
): ListStateHandle<TList> {
  // `ListStateHandle<TList>` is built on `ListState<TList>`, a conditional type the compiler
  // cannot evaluate while `TList` is generic. The hook works on the list as a `LooseList` —
  // which every definition is — and narrows the handle once, where it returns it.
  const loose: LooseList = list;
  const location = locationOf(loose, router);
  const [machine] = useState(() => createLocalStore(createListStateMachine(location)));
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
    machine.update((current) => observeLocation(current, location));
  }, [location, machine]);

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
    (changes: LooseChanges, options: SetOptions = {}): void => {
      const current = read();
      const href = buildListHref(
        loose,
        {
          pathname: routerRef.current.pathname,
          search: searchOfHref(current.draft ?? current.location),
        },
        changes
      );

      commit(href, options.replace ?? false);
    },
    [commit, loose, read]
  );

  const setPage = useCallback(
    (page: number, options: Omit<SetOptions, 'debounce'> = {}): void => {
      set({ page }, options);
    },
    [set]
  );

  const draftSearch = searchOfHref(view.draft ?? view.location);
  const committedSearch = searchOfHref(view.inflight.at(-1) ?? view.location);
  const isPending = isNavigating || view.debouncing || view.inflight.length > 0;
  const state = useMemo(() => readListState(loose, draftSearch), [draftSearch, loose]);
  const request = useMemo(
    () => buildListRequest(loose, readListState(loose, committedSearch)),
    [committedSearch, loose]
  );
  const href = useCallback(
    (changes: LooseChanges = {}): string =>
      buildListHref(loose, { pathname: router.pathname, search: draftSearch }, changes),
    [draftSearch, loose, router.pathname]
  );

  return useMemo(
    () => ({ href, isPending, request, set, setPage, state }) as unknown as ListStateHandle<TList>,
    [href, isPending, request, set, setPage, state]
  );
}
