import type { ListRegistry } from '../types/list-registry.type';
import type { LooseList } from '../types/loose-list.type';
import type { ParamClaim } from '../types/param-claim.type';

/**
 * Record that a mounted list owns its URL names, and warn when another list already owns one.
 *
 * Two different lists that name a parameter the same read and write the same URL value, so
 * paging one pages the other. Lists that share the same param object share it on purpose and do
 * not warn; neither does the same list mounted twice. A development aid: {@link useRouterAdapter}
 * does not call it in a production build.
 *
 * @param registry - The registry of the adapter provider the list is under
 * @param list - The list that mounted
 * @returns A function that drops the claims, for when the list unmounts
 */
export function claimListParams(registry: ListRegistry, list: LooseList): () => void {
  const claims = Object.values(list.params).map((param): ParamClaim => ({ list, param }));

  claims.forEach((claim) => {
    const { key } = claim.param;
    const other = [...registry.claims].find(
      (owner) => owner.param.key === key && owner.list !== list && owner.param !== claim.param
    );
    const report = `${key}|${other?.list.resource}|${list.resource}`;

    if (other && !registry.reported.has(report)) {
      registry.reported.add(report);
      console.warn(
        `[@qubeejs/react] The lists "${other.list.resource}" and "${list.resource}" both own the URL parameter "${key}", so changing one changes the other. Give one of them another name, or declare the param once and use the same object in both lists if this is intended.`
      );
    }

    registry.claims.add(claim);
  });

  return (): void => {
    claims.forEach((claim) => registry.claims.delete(claim));
  };
}

/**
 * Create an empty {@link ListRegistry}.
 *
 * @returns A registry with no claims
 */
export function createListRegistry(): ListRegistry {
  return { claims: new Set(), reported: new Set() };
}
