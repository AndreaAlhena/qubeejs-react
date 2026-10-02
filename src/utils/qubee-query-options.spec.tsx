import type { ListRequest, PaginatedResult, RawResponse } from '@qubeejs/core';
import type { ReactElement, ReactNode } from 'react';

import { buildListRequest, readListState } from '@qubeejs/core';
import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  skipToken,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';

import { articleList } from '../../test/fixtures/article-list';
import { QubeeFetchError } from '../errors/qubee-fetch.error';
import { qubeeQueryOptions } from './qubee-query-options';

type ArticleRow = { id: number; title: string };

const requestFor = (search: string): ListRequest =>
  buildListRequest(articleList, readListState(articleList, search));

/** The body a Strapi API answers with for page `page`: one article, numbered after the page. */
const bodyOf = (page: number): RawResponse => ({
  data: [{ id: page, title: `Article ${page}` }],
  meta: { pagination: { page, pageCount: 3, pageSize: 20, total: 57 } },
});

const pageOf = (page: number): PaginatedResult<ArticleRow> =>
  requestFor(`page=${page}`).paginate<ArticleRow>(bodyOf(page)).toPlain();

/** A fetcher that answers with the page its address asks for, and records how it was called. */
function createFetcher(init: ResponseInit = {}): ReturnType<typeof vi.fn<QubeeFetcher>> {
  return vi.fn<QubeeFetcher>((uri) => {
    const page = Number(new URL(uri, 'https://example.com').searchParams.get('pagination[page]'));

    return Promise.resolve(new Response(JSON.stringify(bodyOf(page)), init));
  });
}

/** A client that reports a failure at once, and a wrapper that provides it. */
function createClient(): {
  client: QueryClient;
  wrapper: (props: { children: ReactNode }) => ReactElement;
} {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    client,
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe('qubeeQueryOptions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the options', () => {
    it('should key a request by its address and its headers', () => {
      const request: ListRequest = { ...requestFor('page=2'), headers: { Range: '20-39' } };

      expect(qubeeQueryOptions(request).queryKey).toEqual([
        'qubee',
        request.uri,
        { Range: '20-39' },
      ]);
    });

    it('should key a request without headers with null', () => {
      const request = requestFor('page=2');

      expect(qubeeQueryOptions(request).queryKey).toEqual(['qubee', request.uri, null]);
    });

    it('should set nothing but the key and the function', () => {
      expect(Object.keys(qubeeQueryOptions(requestFor(''))).sort()).toEqual([
        'queryFn',
        'queryKey',
      ]);
    });

    it('should skip a null request', () => {
      const options = qubeeQueryOptions(null);

      expect(options.queryFn).toBe(skipToken);
      expect(options.queryKey).toEqual(['qubee', null, null]);
    });

    it('should type the data of the key', () => {
      const { client } = createClient();
      const options = qubeeQueryOptions<ArticleRow>(requestFor(''));

      expectTypeOf(client.getQueryData(options.queryKey)).toEqualTypeOf<
        PaginatedResult<ArticleRow> | undefined
      >();
    });
  });

  describe('with useQuery', () => {
    it('should fetch the page through the fetcher, with the signal of TanStack Query', async () => {
      const fetcher = createFetcher();
      const request = requestFor('page=2');
      const { wrapper } = createClient();
      const { result } = renderHook(
        () => useQuery(qubeeQueryOptions<ArticleRow>(request, { fetcher })),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(pageOf(2));
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(request.uri, {
        headers: {},
        signal: expect.any(AbortSignal) as AbortSignal,
      });
    });

    it('should use the global fetch when no fetcher is given', async () => {
      const globalFetch = createFetcher();
      const { wrapper } = createClient();

      vi.stubGlobal('fetch', globalFetch);

      const { result } = renderHook(
        () => useQuery(qubeeQueryOptions<ArticleRow>(requestFor('page=1'))),
        { wrapper }
      );

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
    });

    it('should fetch once for two request objects that ask for the same page', async () => {
      const fetcher = createFetcher();
      const { wrapper } = createClient();
      const { result } = renderHook(
        () => [
          useQuery(qubeeQueryOptions<ArticleRow>(requestFor('page=1'), { fetcher })),
          useQuery(qubeeQueryOptions<ArticleRow>(requestFor('page=1'), { fetcher })),
        ],
        { wrapper }
      );

      await waitFor(() => expect(result.current[1].isSuccess).toBe(true));

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should fetch nothing for a null request', async () => {
      const fetcher = createFetcher();
      const { wrapper } = createClient();
      const { result } = renderHook(
        () => useQuery(qubeeQueryOptions<ArticleRow>(null, { fetcher })),
        { wrapper }
      );

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(result.current).toMatchObject({ data: undefined, fetchStatus: 'idle' });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should take the app's own options beside it", async () => {
      const fetcher = createFetcher();
      const { wrapper } = createClient();
      const { rerender, result } = renderHook(
        ({ page }: { page: number }) =>
          useQuery({
            ...qubeeQueryOptions<ArticleRow>(requestFor(`page=${page}`), { fetcher }),
            placeholderData: keepPreviousData,
          }),
        { initialProps: { page: 1 }, wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      rerender({ page: 2 });

      // The first page stays on screen while the second loads.
      expect(result.current).toMatchObject({ data: pageOf(1), isPlaceholderData: true });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));
    });

    it('should report a status that is not ok as a QubeeFetchError', async () => {
      const { wrapper } = createClient();
      const { result } = renderHook(
        () =>
          useQuery(
            qubeeQueryOptions<ArticleRow>(requestFor('page=1'), {
              fetcher: createFetcher({ status: 503 }),
            })
          ),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(QubeeFetchError);
      expect(result.current.error).toMatchObject({ status: 503 });
    });
  });

  describe('with the rest of TanStack Query', () => {
    it('should suspend with useSuspenseQuery', async () => {
      const fetcher = createFetcher();
      const { wrapper: Wrapper } = createClient();

      function Titles(): ReactElement {
        const { data } = useSuspenseQuery(
          qubeeQueryOptions<ArticleRow>(requestFor('page=3'), { fetcher })
        );

        return <output>{data.data.map((article) => article.title).join()}</output>;
      }

      render(
        <Wrapper>
          <Suspense fallback={<p>Loading</p>}>
            <Titles />
          </Suspense>
        </Wrapper>
      );

      expect(screen.getByText('Loading')).toBeDefined();
      expect((await screen.findByRole('status')).textContent).toBe('Article 3');
    });

    it('should prefetch outside React, and serve the page from the cache afterwards', async () => {
      const fetcher = createFetcher();
      const { client, wrapper } = createClient();
      const options = qubeeQueryOptions<ArticleRow>(requestFor('page=2'), { fetcher });

      await client.prefetchQuery({ ...options, staleTime: 60_000 });

      expect(client.getQueryData(options.queryKey)).toEqual(pageOf(2));

      const { result } = renderHook(() => useQuery({ ...options, staleTime: 60_000 }), { wrapper });

      expect(result.current.data).toEqual(pageOf(2));
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should resolve with the page from ensureQueryData', async () => {
      const { client } = createClient();

      await expect(
        client.ensureQueryData(
          qubeeQueryOptions<ArticleRow>(requestFor('page=1'), { fetcher: createFetcher() })
        )
      ).resolves.toEqual(pageOf(1));
    });

    it('should reach every list query through the first part of the key', async () => {
      const fetcher = createFetcher();
      const { client, wrapper } = createClient();
      const { result } = renderHook(
        () => useQuery(qubeeQueryOptions<ArticleRow>(requestFor('page=1'), { fetcher })),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await act(() => client.invalidateQueries({ queryKey: ['qubee'] }));

      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
