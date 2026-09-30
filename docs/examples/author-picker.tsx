import { type RawResponse, SortEnum, STRAPI_DRIVER } from '@qubeejs/core';
import { useQubee } from '@qubeejs/react';
import { useEffect, useState } from 'react';

import { API_URL } from './article-list';

/** An author as the Strapi API returns it. */
type Author = {
  id: number;
  name: string;
};

type AuthorPickerProps = {
  onPick: (author: Author) => void;
};

/** A paged list of authors in a dialog: its query lives in memory, not in the URL. */
export function AuthorPicker({ onPick }: AuthorPickerProps) {
  const { builder, paginator, state, store } = useQubee({ baseUrl: API_URL, driver: STRAPI_DRIVER });
  const [authors, setAuthors] = useState<Author[]>([]);

  // Configure once, after mount. Strict Mode runs effects twice in development:
  // the second run finds a resource already set, and leaves the query alone.
  useEffect(() => {
    if (store.getSnapshot().resource) {
      return;
    }

    builder.setResource('authors').addSort('name', SortEnum.ASC).setLimit(10);
  }, [builder, store]);

  // Reading during render is safe: generateUri() derives from the current snapshot.
  const uri = state.resource ? builder.generateUri() : null;

  useEffect(() => {
    if (!uri) {
      return;
    }

    const controller = new AbortController();

    fetch(uri, { signal: controller.signal })
      .then((response) => response.json() as Promise<RawResponse>)
      .then((body) => setAuthors(paginator.paginate<Author>(body).data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, [paginator, uri]);

  return (
    <div>
      <ul>
        {authors.map((author) => (
          <li key={author.id}>
            <button onClick={() => onPick(author)} type="button">
              {author.name}
            </button>
          </li>
        ))}
      </ul>
      <button disabled={builder.isFirstPage()} onClick={() => builder.previousPage()} type="button">
        Previous
      </button>
      <button disabled={!builder.hasNextPage()} onClick={() => builder.nextPage()} type="button">
        Next
      </button>
    </div>
  );
}
