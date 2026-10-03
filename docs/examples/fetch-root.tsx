import { QubeeFetchProvider } from '@qubeejs/react';
import type { QubeeFetcher } from '@qubeejs/react';
import type { ReactNode } from 'react';

/** `fetch`, with the session's token on every request. */
const authFetch: QubeeFetcher = (uri, init) =>
  fetch(uri, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}` },
  });

/** Every fetching hook below sends its requests through `authFetch`. */
export function FetchRoot({ children }: { children: ReactNode }) {
  return <QubeeFetchProvider fetcher={authFetch}>{children}</QubeeFetchProvider>;
}
