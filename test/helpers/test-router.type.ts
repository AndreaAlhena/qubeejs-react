import type { AdapterNavigateOptions } from '../../src/types/adapter-navigate-options.type';
import type { RouterAdapter } from '../../src/types/router-adapter.type';

/**
 * One call to a test router's `navigate`.
 */
export type TestNavigation = {
  href: string;
  options: AdapterNavigateOptions;
};

/**
 * How a test router lands navigations.
 */
export type TestRouterOptions = {
  /** `auto` lands each navigation at once; `manual` queues them until `settle()`. */
  mode?: 'auto' | 'manual';
  /** Changes an href as it lands, as a router that reorders or re-encodes the query would. */
  rewrite?: (href: string) => string;
};

/**
 * An in-memory router for useQubeeList specs.
 */
export type TestRouter = {
  /** Move the URL without the hook asking: Back, Forward, a link elsewhere. */
  external: (href: string) => void;
  /** Every navigation the hook asked for, in order. */
  navigations: TestNavigation[];
  /** Land the oldest queued navigation (manual mode). */
  settle: () => void;
  /** The {@link RouterAdapter} for the current URL; call it inside the hook under test. */
  useRouter: () => RouterAdapter;
};
