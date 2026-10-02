/**
 * `@qubeejs/react/fetch` — fetch one page of a list, anywhere.
 *
 * A server-safe entry point: it is not a client module and imports nothing from React, so a
 * Server Component, a route loader or a script can call it. The hooks that fetch are in the main
 * entry, and call the same function.
 */

// Types
export type { QubeeFetcher } from '../types/qubee-fetcher.type';

// Errors
export { QubeeFetchError } from '../errors/qubee-fetch.error';

// Functions
export { fetchQubeePage } from '../utils/fetch-qubee-page';
