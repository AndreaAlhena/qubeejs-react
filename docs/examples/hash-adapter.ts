import { createAdapterProvider, type RouterAdapter } from '@qubeejs/react';
import { useMemo, useSyncExternalStore } from 'react';

/** Follow the URL hash. */
function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener);

  return () => window.removeEventListener('hashchange', listener);
}

/** The hash without its `#`: `/articles?page=2`. */
const readHash = () => window.location.hash.slice(1);

/** On the server there is no hash. */
const readServerHash = () => '';

/** A router adapter for an app that routes through the URL hash. */
function useHashAdapter(): RouterAdapter {
  const hash = useSyncExternalStore(subscribe, readHash, readServerHash);
  const [pathname = '', search = ''] = hash.split('?');

  return useMemo(
    (): RouterAdapter => ({
      navigate: (href, { replace }) => {
        if (replace) {
          window.location.replace(`#${href}`);
        } else {
          window.location.hash = href;
        }
      },
      pathname,
      search,
    }),
    [pathname, search]
  );
}

/** Wrap the app in it, and every list below reads and writes the hash. */
export const HashAdapter = createAdapterProvider(useHashAdapter);
