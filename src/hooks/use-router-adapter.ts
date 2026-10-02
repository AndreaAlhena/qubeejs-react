import { useContext, useEffect } from 'react';

import type { LooseList } from '../types/loose-list.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { adapterContext } from '../contexts/adapter-context';
import { MissingRouterAdapterError } from '../errors/missing-router-adapter.error';
import { claimListParams } from '../utils/list-registry';
import { useNoAdapter } from './use-no-adapter';

/**
 * Resolve a list's router adapter: the one passed in, else the nearest provider's.
 *
 * Internal to {@link useQubeeList}. The provider's hook is called even when an adapter is passed
 * in, because hooks cannot be called conditionally; the adapter passed in is the one used. A
 * provider keeps the hook it was first rendered with, so the hook taken from context never
 * changes for the components below it — which is what makes calling it safe.
 *
 * A list that takes its adapter from a provider registers its URL names with it, so that two
 * lists claiming the same name are reported.
 *
 * @param list - The list the adapter is for
 * @param adapter - The adapter passed to the hook, if any
 * @returns The adapter to use
 * @throws {MissingRouterAdapterError} When there is neither an adapter nor a provider
 */
export function useRouterAdapter(
  list: LooseList,
  adapter: RouterAdapter | undefined
): RouterAdapter {
  const scope = useContext(adapterContext);
  const useProvided = scope?.useAdapter ?? useNoAdapter;
  const provided = useProvided();
  const registry = adapter ? undefined : scope?.registry;

  useEffect(() => (registry ? claimListParams(registry, list) : undefined), [list, registry]);

  const resolved = adapter ?? provided;

  if (!resolved) {
    throw new MissingRouterAdapterError();
  }

  return resolved;
}
