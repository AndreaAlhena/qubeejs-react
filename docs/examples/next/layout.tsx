import { NextAdapter } from '@qubeejs/react/next';
import type { ReactNode } from 'react';

import { Providers } from './providers';

/**
 * The root layout, a Server Component. It renders the adapter provider directly: the entry is a
 * client module, and the provider takes only serialisable props.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextAdapter>
          <Providers>{children}</Providers>
        </NextAdapter>
      </body>
    </html>
  );
}
