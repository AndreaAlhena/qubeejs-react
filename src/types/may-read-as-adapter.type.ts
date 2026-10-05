/**
 * `true` when a function fits at `navigate` in an input of type `TInput` — a member, optional or
 * not, a member of one type of a union, or an index signature — or when any object fits the type,
 * as for `object` and `{}`; `never` otherwise.
 *
 * {@link useQubeeList} reads the one argument after a list as its adapter when that argument is an
 * object whose `navigate` is a function, so {@link QubeeListArgs} refuses an input type for which
 * this is `true`. A function type has no keys either, but a function is never read as the
 * adapter, so it stays an input.
 *
 * @typeParam TInput - The input a list declares
 */
export type MayReadAsAdapter<TInput> = TInput extends unknown
  ? [keyof TInput] extends [never]
    ? TInput extends (...args: never[]) => unknown
      ? never
      : true
    : 'navigate' extends keyof TInput
      ? ((...args: never[]) => unknown) extends TInput['navigate' & keyof TInput]
        ? true
        : [Extract<TInput['navigate' & keyof TInput], (...args: never[]) => unknown>] extends [
              never,
            ]
          ? never
          : true
      : never
  : never;
