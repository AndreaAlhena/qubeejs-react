import { TanStackRouterAdapter } from '@qubeejs/react/tanstack-router';
import { createRootRoute, Outlet } from '@tanstack/react-router';

/** The root route: every list under it reads and writes the URL through TanStack Router. */
export const rootRoute = createRootRoute({
  component: () => (
    <TanStackRouterAdapter>
      <Outlet />
    </TanStackRouterAdapter>
  ),
});
