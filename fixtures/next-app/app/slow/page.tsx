import type { ReactElement } from 'react';

/** Rendered on every request, never ahead of time: the delay is the point. */
export const dynamic = 'force-dynamic';

/** How long the page takes to render — longer than the search debounce. */
const RENDER_DELAY_MS = 1500;

/** A page slow enough for a pending debounce to fire while the navigation to it is in flight. */
export default async function SlowPage(): Promise<ReactElement> {
  await new Promise((resolve) => setTimeout(resolve, RENDER_DELAY_MS));

  return (
    <main>
      <h1 id="slow">Slow page</h1>
    </main>
  );
}
