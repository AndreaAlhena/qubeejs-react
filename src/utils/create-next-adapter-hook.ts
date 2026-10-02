import type { NextAdapterOptions } from '../types/next-adapter-options.type';
import type { RouterAdapter } from '../types/router-adapter.type';

import { useNextAdapter } from '../hooks/use-next-adapter';

/**
 * Make the adapter hook of one {@link NextAdapter}, with its options bound.
 *
 * The hook is created once per provider and never changes, which is what a provider's adapter
 * hook must be.
 *
 * @param options - The options every list below the provider navigates with
 * @returns A hook that takes no arguments and returns the App Router's {@link RouterAdapter}
 */
export function createNextAdapterHook(options: NextAdapterOptions): () => RouterAdapter {
  return function useNextAdapterWith(): RouterAdapter {
    return useNextAdapter(options);
  };
}
