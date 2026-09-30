import type { ListRouter } from '@qubeejs/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

/** React Router as a ListRouter: its location in, its navigate out. */
export function useReactRouter(): ListRouter {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return {
    navigate: (href, { replace }) => {
      // React Router's navigate may return a promise; the list does not wait for it.
      void navigate(href, { replace });
    },
    pathname,
    search,
  };
}
