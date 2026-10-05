import type { RouterAdapter } from '../types/router-adapter.type';

/**
 * Whether the one argument after a list is the router adapter passed to {@link useQubeeList}: an
 * object whose `navigate` is a function. Anything else — `null` and bare values included — is the
 * list's input. {@link QubeeListArgs} refuses an input type that could pass this test.
 *
 * @param value - The first argument after the list
 * @returns `true` for a router adapter
 */
export function isRouterAdapter(value: unknown): value is RouterAdapter {
  return (
    typeof value === 'object' &&
    value !== null &&
    'navigate' in value &&
    typeof value.navigate === 'function'
  );
}
