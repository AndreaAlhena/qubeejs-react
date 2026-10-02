/**
 * `@qubeejs/react/tanstack-query` — fetch a list's pages through TanStack Query 5.62 and later.
 *
 * Its own entry point, so that only apps that import it need `@tanstack/react-query` installed.
 * It is server-safe: not a client module, so its options can be built in a Server Component or
 * a route loader to prefetch a page.
 *
 * @module
 */

// Types
export type { QubeeQueryKey } from '../types/qubee-query-key.type';

// Functions
export { qubeeQueryOptions } from '../utils/qubee-query-options';
