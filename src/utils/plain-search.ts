/**
 * Read a query string as plain text, for the `parseSearch` option of a TanStack Router.
 *
 * TanStack Router's own serialisers read every value as JSON and write it back, so a list's
 * query does not survive them: `10 ` lands as `10`, `"react hooks"` loses its quotes, `1.50`
 * becomes `1.5`. With this function and {@link stringifySearch}, every value stays the string it
 * is in the URL, and a name that repeats is a list of strings.
 *
 * Every search value of the app is then a string: a route whose `validateSearch` wants a number
 * has to coerce it.
 *
 * @param searchStr - The query string, with or without its `?`
 * @returns The search object the router hands to its routes
 *
 * @example
 * ```ts
 * const router = createRouter({ parseSearch, routeTree, stringifySearch });
 * ```
 */
export function parseSearch(searchStr: string): Record<string, string | string[]> {
  const search: Record<string, string | string[]> = {};

  for (const [name, value] of new URLSearchParams(searchStr)) {
    const current = search[name];

    search[name] = current === undefined ? value : [...[current].flat(), value];
  }

  return search;
}

/**
 * Write a search object as a plain query string, for the `stringifySearch` option of a TanStack
 * Router — the other half of {@link parseSearch}.
 *
 * A list is written as a repeated name, `undefined` and `null` are left out, and a value that is
 * not text — a number, a boolean, an object — is written as its JSON.
 *
 * @param search - The search object, as the router holds it
 * @returns The query string with its `?`, or an empty string for an empty search
 *
 * @example
 * ```ts
 * stringifySearch({ page: 2, tag: ['a', 'b'] }); // '?page=2&tag=a&tag=b'
 * ```
 */
export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [name, value] of Object.entries(search)) {
    for (const item of [value].flat()) {
      if (item !== undefined && item !== null) {
        params.append(name, typeof item === 'string' ? item : JSON.stringify(item));
      }
    }
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}
