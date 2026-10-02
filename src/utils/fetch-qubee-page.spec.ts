import type { ListRequest } from '@qubeejs/core';

import { buildListRequest, readListState } from '@qubeejs/core';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';

import { articleList } from '../../test/fixtures/article-list';
import { QubeeFetchError } from '../errors/qubee-fetch.error';
import { fetchQubeePage } from './fetch-qubee-page';

type ArticleRow = { id: number; title: string };

const STRAPI_PAGE = {
  data: [
    { id: 1, title: 'Hooks in depth' },
    { id: 2, title: 'Server rendering' },
  ],
  meta: { pagination: { page: 2, pageCount: 3, pageSize: 20, total: 57 } },
};

const requestFor = (search: string): ListRequest =>
  buildListRequest(articleList, readListState(articleList, search));

/** A fetcher that answers every request with `body`, and records how it was called. */
const answering = (
  body: unknown,
  init: ResponseInit = {}
): ReturnType<typeof vi.fn<QubeeFetcher>> =>
  vi.fn<QubeeFetcher>(() => Promise.resolve(new Response(JSON.stringify(body), init)));

describe('fetchQubeePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the request', () => {
    it('should ask the fetcher for the address of the request', async () => {
      const fetcher = answering(STRAPI_PAGE);
      const request = requestFor('page=2');

      await fetchQubeePage(request, { fetcher });

      expect(fetcher).toHaveBeenCalledExactlyOnceWith(request.uri, {
        headers: {},
        signal: undefined,
      });
    });

    it('should send the headers the driver wants on the request', async () => {
      const fetcher = answering(STRAPI_PAGE);
      const request: ListRequest = {
        ...requestFor('page=2'),
        headers: { Range: '20-39', 'Range-Unit': 'items' },
      };

      await fetchQubeePage(request, { fetcher });

      expect(fetcher.mock.calls[0][1].headers).toEqual({ Range: '20-39', 'Range-Unit': 'items' });
    });

    it('should hand the fetcher a copy of the headers, which it may change', async () => {
      const fetcher = answering(STRAPI_PAGE);
      const headers = Object.freeze({ Range: '0-19' });

      await fetchQubeePage({ ...requestFor(''), headers }, { fetcher });

      expect(fetcher.mock.calls[0][1].headers).not.toBe(headers);
    });

    it('should pass the signal on', async () => {
      const fetcher = answering(STRAPI_PAGE);
      const { signal } = new AbortController();

      await fetchQubeePage(requestFor(''), { fetcher, signal });

      expect(fetcher.mock.calls[0][1].signal).toBe(signal);
    });

    it('should use the global fetch when no fetcher is given', async () => {
      const globalFetch = answering(STRAPI_PAGE);
      const request = requestFor('page=2');

      vi.stubGlobal('fetch', globalFetch);

      await fetchQubeePage(request);

      expect(globalFetch).toHaveBeenCalledExactlyOnceWith(request.uri, {
        headers: {},
        signal: undefined,
      });
    });
  });

  describe('the result', () => {
    it('should return the page as a plain object', async () => {
      const request = requestFor('page=2');
      const page = await fetchQubeePage<ArticleRow>(request, { fetcher: answering(STRAPI_PAGE) });

      expect(page).toEqual(request.paginate<ArticleRow>(STRAPI_PAGE).toPlain());
      expect(Object.getPrototypeOf(page)).toBe(Object.prototype);
      expect(page.data.map((row) => row.title)).toEqual(['Hooks in depth', 'Server rendering']);
      expect(page.lastPage).toBe(3);
    });

    it('should hand the response headers to the parser', async () => {
      const request = requestFor('');
      const paginate = vi.spyOn(request, 'paginate');
      const fetcher = answering(STRAPI_PAGE, { headers: { 'Content-Range': '0-19/57' } });

      await fetchQubeePage(request, { fetcher });

      const headers = paginate.mock.calls[0][1] as Headers;

      expect(headers.get('Content-Range')).toBe('0-19/57');
    });
  });

  describe('failures', () => {
    it('should throw a QubeeFetchError for a status that is not ok', async () => {
      const request = requestFor('page=9');
      const failure = fetchQubeePage(request, {
        fetcher: answering({ error: 'Not found' }, { status: 404 }),
      });

      await expect(failure).rejects.toBeInstanceOf(QubeeFetchError);
      await expect(failure).rejects.toMatchObject({ status: 404, uri: request.uri });
    });

    it('should leave the body of a failed response for the caller to read', async () => {
      const error: unknown = await fetchQubeePage(requestFor(''), {
        fetcher: answering({ error: 'Not found' }, { status: 404 }),
      }).catch((reason: unknown) => reason);

      await expect((error as QubeeFetchError).response.json()).resolves.toEqual({
        error: 'Not found',
      });
    });

    it('should reject with what the fetcher rejects with', async () => {
      const offline = new TypeError('Failed to fetch');

      await expect(
        fetchQubeePage(requestFor(''), { fetcher: () => Promise.reject(offline) })
      ).rejects.toBe(offline);
    });

    it('should reject, not throw, when the fetcher throws before it returns a promise', async () => {
      const broken = new Error('no token');
      const fetcher: QubeeFetcher = () => {
        throw broken;
      };

      await expect(fetchQubeePage(requestFor(''), { fetcher })).rejects.toBe(broken);
    });

    it('should reject when the body is not JSON', async () => {
      const fetcher: QubeeFetcher = () => Promise.resolve(new Response('<html>'));

      await expect(fetchQubeePage(requestFor(''), { fetcher })).rejects.toBeInstanceOf(SyntaxError);
    });
  });
});
