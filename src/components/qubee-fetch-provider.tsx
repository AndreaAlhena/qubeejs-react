import type { ReactElement } from 'react';

import type { QubeeFetchProviderProps } from '../types/qubee-fetch-provider-props.type';

import { fetcherContext } from '../contexts/fetcher-context';

/**
 * Set what performs the requests of every fetching hook below it — {@link useQubeeQuery}, and
 * `useQubeeSWR` from the SWR entry.
 *
 * Without a provider the hooks use the global `fetch`. A hook given its own `fetcher` uses that
 * one; the nearest provider wins over the ones above it. In a Next.js server layout, render it
 * inside a Client Component of your own: a function cannot cross the server–client boundary as
 * a prop.
 *
 * @param props - The fetcher, and the subtree
 * @returns The subtree, with the fetcher in context
 *
 * @example
 * ```tsx
 * const authFetch: QubeeFetcher = (uri, init) =>
 *   fetch(uri, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token()}` } });
 *
 * <QubeeFetchProvider fetcher={authFetch}>
 *   <App />
 * </QubeeFetchProvider>
 * ```
 */
export function QubeeFetchProvider(props: QubeeFetchProviderProps): ReactElement {
  return <fetcherContext.Provider value={props.fetcher}>{props.children}</fetcherContext.Provider>;
}
