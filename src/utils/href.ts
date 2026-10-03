import { toSearchParams } from '@qubeejs/core';

/**
 * Join a pathname and a query into an href, leaving `?` out when the query is empty — the shape
 * `buildListHref` produces.
 *
 * @param pathname - The pathname, e.g. `/articles`
 * @param search - The query without `?`, e.g. `q=react`
 * @returns `pathname?search`, or `pathname` alone
 */
export function joinHref(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * An href in the one spelling hrefs are compared in: the query re-encoded by `URLSearchParams`.
 *
 * `buildListHref` leaves commas unescaped (`sort=-publishedAt,title`) while a router reports the
 * URL however the browser spells it, so raw strings never compare; normalised ones do.
 *
 * @param href - A pathname plus an optional `?query`
 * @returns The same href with its query normalised
 */
export function normalizeHref(href: string): string {
  return joinHref(pathnameOfHref(href), toSearchParams(searchOfHref(href)).toString());
}

/**
 * The pathname part of an href.
 *
 * @param href - A pathname plus an optional `?query`
 * @returns Everything before the first `?`
 */
export function pathnameOfHref(href: string): string {
  const at = href.indexOf('?');

  return at === -1 ? href : href.slice(0, at);
}

/**
 * The query part of an href, without `?`.
 *
 * @param href - A pathname plus an optional `?query`
 * @returns Everything after the first `?`, or `''`
 */
export function searchOfHref(href: string): string {
  const at = href.indexOf('?');

  return at === -1 ? '' : href.slice(at + 1);
}
