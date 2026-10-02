'use client';

import type { RouterAdapter } from '@qubeejs/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Next's App Router as a RouterAdapter. `scroll: false` keeps the reader where
 * they are when a filter or a page number changes.
 */
export function useNextListRouter(): RouterAdapter {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  return {
    navigate: (href, { replace }) =>
      replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false }),
    pathname,
    search,
  };
}
