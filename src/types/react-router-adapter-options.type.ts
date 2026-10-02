/**
 * Options of {@link useReactRouterAdapter}.
 */
export type ReactRouterAdapterOptions = {
  /**
   * Let React Router reset the scroll position when a list navigates, as its
   * `<ScrollRestoration>` does for links. Default `false`: a filter or a page number that changes
   * keeps the reader where they are.
   */
  scroll?: boolean;
};
