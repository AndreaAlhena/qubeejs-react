'use client';

import type { ListRouter } from '@qubeejs/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Next's App Router as a ListRouter. `scroll: false` keeps the reader where
 * they are when a filter or a page number changes.
 */
export function useNextListRouter(): ListRouter {
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
