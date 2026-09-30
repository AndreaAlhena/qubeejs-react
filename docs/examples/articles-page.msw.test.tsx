import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { API_URL } from './article-list';
import { ArticlesPage } from './quick-start';

/** Every URL the API was asked for, in order. */
const requests: URL[] = [];

const server = setupServer(
  http.get(`${API_URL}/articles`, ({ request }) => {
    requests.push(new URL(request.url));

    return HttpResponse.json({
      data: [
        { id: 1, publishedAt: '2026-09-01T10:00:00.000Z', status: 'published', title: 'Hooks, not plumbing' },
        { id: 2, publishedAt: '2026-08-12T10:00:00.000Z', status: 'published', title: 'The URL is the state' },
      ],
      meta: { pagination: { page: 1, pageCount: 1, pageSize: 20, total: 2 } },
    });
  })
);

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
  window.history.replaceState(null, '', '/');
});

afterAll(() => {
  server.close();
});

describe('ArticlesPage', () => {
  it('should render the rows the API returns', async () => {
    render(<ArticlesPage />);

    expect(await screen.findByText('Hooks, not plumbing')).toBeTruthy();
    expect(screen.getByText('The URL is the state')).toBeTruthy();
  });

  it('should send the search in the page URL to the API', async () => {
    window.history.replaceState(null, '', '/articles?q=react');

    render(<ArticlesPage />);
    await screen.findByText('Hooks, not plumbing');

    expect(requests[0]?.searchParams.get('filters[title][$containsi]')).toBe('react');
  });
});
