import type { ParamClaim } from './param-claim.type';

/**
 * Which mounted lists own which URL names under one adapter provider, for the collision warning.
 *
 * Internal.
 */
export type ListRegistry = {
  /** Every claim of every mounted list component: one per param of its list. */
  claims: Set<ParamClaim>;
  /** The collisions already reported, so that each is logged once. */
  reported: Set<string>;
};
