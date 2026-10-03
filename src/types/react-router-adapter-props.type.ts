import type { ReactNode } from 'react';

/**
 * Props of {@link ReactRouterAdapter}.
 */
export type ReactRouterAdapterProps = {
  /** The subtree whose lists use this adapter. */
  children: ReactNode;
  /**
   * Let React Router reset the scroll position when a list navigates. Default `false`. Read on
   * the first render only.
   */
  scroll?: boolean;
};
