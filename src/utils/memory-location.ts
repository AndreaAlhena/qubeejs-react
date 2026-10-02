import type { SearchParamsInput } from '@qubeejs/core';

import { toSearchParams } from '@qubeejs/core';

import type { LocalStore } from '../types/local-store.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { useMemoryLocation } from '../hooks/use-memory-location';
import { createLocalStore } from './create-local-store';

/**
 * Make the adapter hook of one in-memory location, for a provider to put in context.
 *
 * The hook is created once per provider and never changes, which is what a provider's adapter
 * hook must be.
 *
 * @param location - The store that holds the query
 * @returns A hook that follows `location` and returns its {@link RouterAdapter}
 */
export function createMemoryAdapterHook(location: LocalStore<string>): () => RouterAdapter {
  return function useMemoryAdapterOf(): RouterAdapter {
    return useMemoryLocation(location);
  };
}

/**
 * Create the store behind an in-memory adapter: a query string, with no pathname and no history.
 *
 * @param initialSearch - The query the lists start from; empty by default
 * @returns A store holding the query, without `?`
 */
export function createMemoryLocation(initialSearch: SearchParamsInput = ''): LocalStore<string> {
  return createLocalStore(toSearchParams(initialSearch).toString());
}
