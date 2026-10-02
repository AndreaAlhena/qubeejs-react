/**
 * `@qubeejs/react/swr` — fetch a list's pages through SWR 2.
 *
 * Its own entry point, so that only apps that import it need `swr` installed.
 *
 * @module
 */

// Types
export type { QubeeSWROptions } from '../types/qubee-swr-options.type';

// Hooks
export { useQubeeSWR } from '../hooks/use-qubee-swr';
