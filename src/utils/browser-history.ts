import type { ListNavigateOptions } from '../types/list-navigate-options.type';

/**
 * Everyone following the browser history. `pushState` and `replaceState` fire no event, so
 * {@link navigateBrowserHistory} notifies these itself; `popstate` reaches them directly.
 */
const listeners = new Set<() => void>();

/**
 * Move the browser to `href` and tell every subscriber.
 *
 * @param href - The destination, a pathname plus an optional `?query`
 * @param options - Whether to replace the current history entry
 */
export function navigateBrowserHistory(href: string, { replace }: ListNavigateOptions): void {
  const method = replace ? 'replaceState' : 'pushState';

  window.history[method](null, '', href);
  listeners.forEach((listener) => listener());
}

/**
 * The browser's location as one string, stable between changes: pathname plus query, no hash.
 *
 * @returns e.g. `/articles?q=react`
 */
export function readBrowserLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * The location while rendering on the server, where there is no window: empty.
 *
 * @returns `''`
 */
export function readServerLocation(): string {
  return '';
}

/**
 * Follow the browser history: this module's own navigations and the back and forward buttons.
 *
 * @param listener - Called after every change
 * @returns A function that stops following
 */
export function subscribeToBrowserHistory(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);

  return (): void => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}
