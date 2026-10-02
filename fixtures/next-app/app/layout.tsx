import type { ReactElement, ReactNode } from 'react';

import { NextAdapter } from '@qubeejs/react/next';

/**
 * A Server Component. It renders the adapter provider directly: the entry is a client module and
 * the provider takes only serialisable props, so no wrapper file is needed.
 */
export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <NextAdapter>{children}</NextAdapter>
      </body>
    </html>
  );
}
