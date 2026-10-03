import type { ReactElement } from 'react';

import { useState } from 'react';

import type { NextAdapterProps } from '../types/next-adapter-props.type';

import { useNextAdapter } from '../hooks/use-next-adapter';
import { bindAdapterOptions } from '../utils/bind-adapter-options';
import { AdapterScopeProvider } from './adapter-scope-provider';

/**
 * Make the Next.js App Router the router adapter of every list below it.
 *
 * Render it in a layout — a Server Component can render it directly, because this entry is a
 * client module and the provider takes only serialisable props. It reads no search params
 * itself: only the components that use a list do, and on a statically rendered route those need
 * a `<Suspense>` boundary above them, as Next.js requires.
 *
 * @param props - The subtree, and whether navigations scroll to the top
 * @returns The subtree, with the adapter in context
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <NextAdapter>{children}</NextAdapter>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function NextAdapter(props: NextAdapterProps): ReactElement {
  const [useAdapter] = useState(() => bindAdapterOptions(useNextAdapter, { scroll: props.scroll }));

  return <AdapterScopeProvider useAdapter={useAdapter}>{props.children}</AdapterScopeProvider>;
}
