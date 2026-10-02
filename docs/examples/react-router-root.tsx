import { ReactRouterAdapter } from '@qubeejs/react/react-router';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';

import { ArticlePager } from './react-router-pager';

/** The root route: every list under it reads and writes the URL through React Router. */
function Root() {
  return (
    <ReactRouterAdapter>
      <Outlet />
    </ReactRouterAdapter>
  );
}

const router = createBrowserRouter([
  {
    children: [{ element: <ArticlePager lastPage={12} />, path: 'articles' }],
    element: <Root />,
    path: '/',
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
