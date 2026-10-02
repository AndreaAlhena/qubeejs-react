import type { ListRegistry } from './list-registry.type';
import type { RouterAdapter } from './router-adapter.type';

/**
 * What an adapter provider puts in context: the adapter hook — never a router value, so only the
 * components that use a list subscribe to the URL — and the registry of the lists mounted below.
 *
 * Internal.
 */
export type AdapterScope = {
  /** The URL names the lists mounted under this provider own. */
  registry: ListRegistry;
  /** The provider's adapter hook; list hooks call it themselves. */
  useAdapter: () => RouterAdapter;
};
