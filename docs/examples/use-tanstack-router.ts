import type { RouterAdapter } from '@qubeejs/react';
import { useLocation, useRouter } from '@tanstack/react-router';

/**
 * TanStack Router as a RouterAdapter. It reads the raw query string and writes
 * whole hrefs through router.navigate, so the list keeps its own URL format
 * instead of TanStack's serialised search objects.
 */
export function useTanStackRouter(): RouterAdapter {
  const router = useRouter();
  const { pathname, searchStr } = useLocation();

  return {
    navigate: (href, { replace }) => void router.navigate({ href, replace }),
    pathname,
    search: searchStr,
  };
}
