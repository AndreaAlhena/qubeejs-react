import type { ReactElement } from 'react';

import { Suspense } from 'react';

import { ArticlesView } from '../articles/articles-view';

/**
 * A statically rendered route: nothing here reads the request. The list reads search params on
 * the client, so Next.js requires the `<Suspense>` boundary — without it, `next build` fails.
 */
export default function StaticPage(): ReactElement {
  return (
    <main>
      <h1>Static</h1>
      <Suspense fallback={<p id="fallback">Loading the list…</p>}>
        <ArticlesView />
      </Suspense>
    </main>
  );
}
