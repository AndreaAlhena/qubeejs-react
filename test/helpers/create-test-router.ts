import { useSyncExternalStore } from 'react';

import type { AdapterNavigateOptions } from '../../src/types/adapter-navigate-options.type';
import type { RouterAdapter } from '../../src/types/router-adapter.type';
import type { TestRouter, TestRouterOptions } from './test-router.type';

import { createLocalStore } from '../../src/utils/create-local-store';
import { pathnameOfHref, searchOfHref } from '../../src/utils/href';

/**
 * Create an in-memory router: a URL, a record of every navigation, and controls.
 *
 * In `auto` mode a navigation lands at once. In `manual` mode it waits in a queue until
 * `settle()` lands the oldest one — how a slow router (Next.js, loaders) behaves.
 *
 * @param initialHref - The URL the router starts at
 * @param options - `mode` (default `auto`) and `rewrite`
 * @returns The router and its controls
 */
export function createTestRouter(initialHref: string, options: TestRouterOptions = {}): TestRouter {
  const { mode = 'auto', rewrite = (href: string): string => href } = options;
  const location = createLocalStore(initialHref);
  const navigations: TestRouter['navigations'] = [];
  const queue: string[] = [];

  const land = (href: string): void => {
    location.update(() => rewrite(href));
  };

  return {
    external: (href: string): void => {
      location.update(() => href);
    },
    navigations,
    settle: (): void => {
      const next = queue.shift();

      if (next !== undefined) {
        land(next);
      }
    },
    useRouter: (): RouterAdapter => {
      const href = useSyncExternalStore(
        location.subscribe,
        location.getSnapshot,
        location.getSnapshot
      );

      return {
        navigate: (target: string, navigateOptions: AdapterNavigateOptions): void => {
          navigations.push({ href: target, options: navigateOptions });

          if (mode === 'manual') {
            queue.push(target);

            return;
          }

          land(target);
        },
        pathname: pathnameOfHref(href),
        search: searchOfHref(href),
      };
    },
  };
}
