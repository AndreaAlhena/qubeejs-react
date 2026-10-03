// The `.js` extension is deliberate: `next` has no `exports` map, so Node's ESM resolver finds
// `next/navigation.js` and not `next/navigation`. Next's own bundlers resolve both.
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js';
import { useMemo } from 'react';

import type { NextAdapterOptions } from '../types/next-adapter-options.type';
import type { RouterAdapter } from '../types/router-adapter.type';

/**
 * The Next.js App Router as a {@link RouterAdapter}: its location in, its `push` and `replace`
 * out.
 *
 * Call it in a Client Component. Pass the result to {@link useQubeeList} for one list, or render
 * {@link NextAdapter} in a layout and every list below finds it. It reads `useSearchParams`, so
 * on a statically rendered route the component that calls it needs a `<Suspense>` boundary above
 * it, as Next.js requires.
 *
 * @param options - `scroll`: scroll to the top on navigation; `false` by default
 * @returns The current pathname and query, and a `navigate` that goes through the App Router
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * function Articles(): ReactElement {
 *   const list = useQubeeList(articleList, useNextAdapter());
 *
 *   return <Link href={list.href({ page: 2 })}>2</Link>;
 * }
 * ```
 */
export function useNextAdapter(options: NextAdapterOptions = {}): RouterAdapter {
  const { scroll = false } = options;
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href, { replace }): void => {
        if (replace) {
          router.replace(href, { scroll });

          return;
        }

        router.push(href, { scroll });
      },
      pathname,
      search,
    }),
    [pathname, router, scroll, search]
  );
}
