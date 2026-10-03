import type { MouseEvent } from 'react';

/**
 * Whether a click on a link should navigate in place: the primary button, no
 * modifier key. Anything else — a middle click, a ⌘-click — is left to the
 * browser, which opens the href in a new tab.
 */
export function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
