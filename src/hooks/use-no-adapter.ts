/**
 * The adapter hook of a tree with no adapter provider: it calls no hook and returns nothing.
 *
 * Internal: {@link useRouterAdapter} calls it in place of a provider's hook, so the hook order
 * is the same with and without a provider.
 *
 * @returns `null`
 */
export function useNoAdapter(): null {
  return null;
}
