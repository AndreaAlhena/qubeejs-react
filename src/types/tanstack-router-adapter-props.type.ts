import type { ReactNode } from 'react';

/**
 * Props of {@link TanStackRouterAdapter}.
 */
export type TanStackRouterAdapterProps = {
  /** The subtree whose lists use this adapter. */
  children: ReactNode;
  /**
   * Scroll to the top of the page when a list navigates. Default `false`. Read on the first
   * render only.
   */
  scroll?: boolean;
};
