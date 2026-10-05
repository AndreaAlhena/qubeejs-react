import type { ListInput } from '@qubeejs/core';

import type { MayReadAsAdapter } from './may-read-as-adapter.type';
import type { RouterAdapter } from './router-adapter.type';

/**
 * The arguments {@link useQubeeList} takes after the list: `[adapter?]` for a list without an
 * input, `[input, adapter?]` for a list that declares one.
 *
 * The input is what the list's request needs besides URL state, such as `{ projectId }` from the
 * route path. It is required for a list that declares one, refused for a list that declares none,
 * and `null` while it is not ready — then the handle's `request` is `null` too.
 *
 * With one argument after the list, the hook reads it as the adapter when it is an object whose
 * `navigate` is a function, and as the input otherwise. An input type where a function fits at
 * `navigate`, or that any object fits, such as `object`, is therefore refused: the error, on the
 * input argument, says it is not assignable to `never`.
 *
 * Generic code cannot call `useQubeeList(list)` with a list type it does not know yet, because
 * whether the list needs an input is unknown until then. It forwards the arguments instead:
 *
 * ```ts
 * function useTaskTable<T extends ListDefinition<ListParams>>(
 *   list: T,
 *   ...args: QubeeListArgs<T>
 * ): QubeeListHandle<T> {
 *   return useQubeeList(list, ...args);
 * }
 * ```
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListArgs<TList> = [ListInput<TList>] extends [never]
  ? [adapter?: RouterAdapter]
  : [MayReadAsAdapter<ListInput<TList>>] extends [never]
    ? [input: ListInput<TList> | null, adapter?: RouterAdapter]
    : [input: never, adapter?: RouterAdapter];
