import type { RouterAdapter } from '../types/router-adapter.type';

/**
 * Make the adapter hook of one adapter provider, with the provider's options bound.
 *
 * The hook is created once per provider and never changes, which is what a provider's adapter
 * hook must be.
 *
 * @typeParam Options - The options the adapter hook takes
 * @param useAdapter - The adapter hook the provider stands for
 * @param options - The options every list below the provider navigates with
 * @returns A hook that takes no arguments and returns that router's {@link RouterAdapter}
 */
export function bindAdapterOptions<Options>(
  useAdapter: (options: Options) => RouterAdapter,
  options: Options
): () => RouterAdapter {
  return function useBoundAdapter(): RouterAdapter {
    return useAdapter(options);
  };
}
