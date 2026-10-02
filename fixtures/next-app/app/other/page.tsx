import type { ReactElement } from 'react';

import Link from 'next/link';

/** Somewhere to go, and to come back from. */
export default function OtherPage(): ReactElement {
  return (
    <main>
      <h1 id="other">Other page</h1>
      <Link href="/articles" id="back-to-articles">
        Articles
      </Link>
    </main>
  );
}
