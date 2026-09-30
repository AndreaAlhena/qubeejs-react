'use client';

import { STRAPI_DRIVER } from '@qubeejs/core';
import { QubeeProvider } from '@qubeejs/react';
import type { ReactNode } from 'react';

/** The app's client-side providers, rendered by the root layout. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QubeeProvider baseUrl={process.env.NEXT_PUBLIC_API_URL} driver={STRAPI_DRIVER}>
      {children}
    </QubeeProvider>
  );
}
