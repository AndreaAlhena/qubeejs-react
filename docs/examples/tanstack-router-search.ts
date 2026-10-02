/**
 * Search serialisers for a TanStack Router that keep the query as plain text.
 *
 * TanStack Router's default pair reads every value as JSON and writes it back, so a search box
 * loses what was typed: `10 ` lands as `10`, `"react hooks"` loses its quotes, `1.50` becomes
 * `1.5`. With this pair every value is the string it is in the URL, and a name that repeats is a
 * list.
 *
 * Pass both to the router: `createRouter({ parseSearch, routeTree, stringifySearch })`.
 */

/** Read a query string: every value as text, a repeated name as a list. */
export function parseSearch(searchStr: string) {
  const search: Record<string, string | string[]> = {};

  for (const [name, value] of new URLSearchParams(searchStr)) {
    const current = search[name];

    search[name] = current === undefined ? value : [...[current].flat(), value];
  }

  return search;
}

/** Write a search object: a list as a repeated name, nothing for `undefined` and `null`. */
export function stringifySearch(search: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [name, value] of Object.entries(search)) {
    for (const item of [value].flat()) {
      if (item !== undefined && item !== null) {
        params.append(name, String(item));
      }
    }
  }

  const query = params.toString();

  return query ? `?${query}` : '';
}
