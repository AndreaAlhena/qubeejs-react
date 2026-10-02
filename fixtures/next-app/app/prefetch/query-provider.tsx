'use client';

import type { ReactElement, ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/** One QueryClient for the browser tab, created once; on the server, one per render. */
export function QueryProvider({ children }: { children: ReactNode }): ReactElement {
  const [client] = useState(() => new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
