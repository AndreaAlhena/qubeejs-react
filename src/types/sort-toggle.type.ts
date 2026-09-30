import type { ListDefinition, SortParam, ToggleSortOptions } from '@qubeejs/core';

import type { SetOptions } from './set-options.type';

/**
 * The keys of a list's params whose param is a `sortParam`.
 */
type SortKeys<TParams> = {
  [K in keyof TParams]-?: TParams[K] extends SortParam<string> ? K : never;
}[keyof TParams];

/**
 * `K` when it is exactly one key; `never` when it is none or a union of several.
 */
type Single<K, TAll = K> = [K] extends [never]
  ? never
  : K extends unknown
    ? [Exclude<TAll, K>] extends [never]
      ? K
      : never
    : never;

/**
 * The API fields the `sortParam` at `K` allows.
 */
type SortFields<TParams, K> = K extends keyof TParams
  ? TParams[K] extends SortParam<infer F>
    ? F
    : never
  : never;

/**
 * The `toggleSort` member of a {@link ListStateHandle}: present only when the list declares
 * exactly one `sortParam`, with `field` typed to the fields that param allows.
 */
export type SortToggle<TList> =
  TList extends ListDefinition<infer TParams>
    ? [Single<SortKeys<TParams>>] extends [never]
      ? Record<never, never>
      : {
          /**
           * Sort by `field` ascending, or flip it when it is already the primary sort; with
           * `multiple`, keep the other sorts. One call is at most one navigation.
           */
          toggleSort: (
            field: SortFields<TParams, Single<SortKeys<TParams>>>,
            options?: SetOptions & ToggleSortOptions
          ) => void;
        }
    : Record<never, never>;
