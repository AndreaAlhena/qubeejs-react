import type { ListRequest, PaginatedResult, RawResponse } from '@qubeejs/core';
import type { ReactElement, ReactNode } from 'react';
import type { SWRResponse } from 'swr';

import { buildListRequest, readListState } from '@qubeejs/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { SWRConfig } from 'swr';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';
import type { QubeeSWROptions } from '../types/qubee-swr-options.type';

import { articleList } from '../../test/fixtures/article-list';
import { QubeeFetchProvider } from '../components/qubee-fetch-provider';
import { QubeeFetchError } from '../errors/qubee-fetch.error';
import { useQubeeSWR } from './use-qubee-swr';

type ArticleRow = { id: number; title: string };

type Props = { options?: QubeeSWROptions<ArticleRow>; request: ListRequest | null };

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

/**
 * StrictMode, as in a development build, with a cache of its own for every test and no retry
 * after a failure. SWR de-duplicates the request StrictMode's second mount would repeat.
 */
function Cache({ children }: { children: ReactNode }): ReactElement {
  return (
    <StrictMode>
      <SWRConfig value={{ provider: () => new Map<string, never>(), shouldRetryOnError: false }}>
        {children}
      </SWRConfig>
    </StrictMode>
  );
}

const renderSWR = (
  initialProps: Props,
  wrapper: (props: { children: ReactNode }) => ReactElement = Cache
): ReturnType<typeof renderHook<SWRResponse<PaginatedResult<ArticleRow>, Error>, Props>> =>
  renderHook(({ options, request }: Props) => useQubeeSWR<ArticleRow>(request, options), {
    initialProps,
    wrapper,
  });

describe('useQubeeSWR', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the request', () => {
    it('should fetch the page through the fetcher', async () => {
      const fetcher = createFetcher();
      const request = requestFor('page=2');
      const { result } = renderSWR({ options: { fetcher }, request });

      expect(result.current).toMatchObject({ data: undefined, isLoading: true });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));

      expect(fetcher).toHaveBeenCalledExactlyOnceWith(request.uri, {
        headers: {},
        signal: undefined,
      });
    });

    it('should send the headers of the request, and key the cache on them', async () => {
      const fetcher = createFetcher();
      const request = requestFor('page=1');
      const options = { fetcher };
      const { rerender, result } = renderSWR({
        options,
        request: { ...request, headers: { Range: '0-19' } },
      });

      await waitFor(() => expect(result.current.data).toBeDefined());
      rerender({ options, request: { ...request, headers: { Range: '20-39' } } });
      await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

      expect(fetcher.mock.calls.map(([, init]) => init.headers)).toEqual([
        { Range: '0-19' },
        { Range: '20-39' },
      ]);
    });

    it('should fetch nothing for a null request', async () => {
      const fetcher = createFetcher();
      const { result } = renderSWR({ options: { fetcher }, request: null });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(result.current).toMatchObject({ data: undefined, isLoading: false });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch once for two request objects that ask for the same page', async () => {
      const fetcher = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: requestFor('page=1') });

      expect(result.current.isValidating).toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('the previous page', () => {
    it('should keep the previous page while the next one loads', async () => {
      const fetcher = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: pageOf(1), isValidating: true });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));
    });

    it('should show no data while the next page loads when keepPreviousData is off', async () => {
      const fetcher = createFetcher();
      const options = { fetcher, keepPreviousData: false };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: undefined, isLoading: true });
    });
  });

  describe('a null request', () => {
    it('should show no page while the request is null', async () => {
      const fetcher = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: null });

      expect(result.current).toMatchObject({
        data: undefined,
        isLoading: false,
        isValidating: false,
      });
    });

    it('should show no page while the request is null, even with keepPreviousData on', async () => {
      const fetcher = createFetcher();
      const options = { fetcher, keepPreviousData: true };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: null });

      expect(result.current.data).toBeUndefined();
    });

    it('should not show the page from before a null request while the next one loads', async () => {
      const fetcher = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: null });
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: undefined, isLoading: true });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));
    });

    it('should show the fallback, not the page from before a null request, while the next one loads', async () => {
      const fetcher = createFetcher();
      const options = { fallbackData: pageOf(9), fetcher };
      const { rerender, result } = renderSWR({ options, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: null });
      rerender({ options, request: requestFor('page=2') });

      expect(result.current.data).toEqual(pageOf(9));

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));
    });

    it('should keep the previous page again once the request after a null one has answered', async () => {
      const fetcher = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderSWR({ options, request: null });

      rerender({ options, request: requestFor('page=1') });
      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: pageOf(1), isValidating: true });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(2)));
    });
  });

  describe('the fetcher', () => {
    it("should use the nearest provider's fetcher", async () => {
      const fetcher = createFetcher();
      const { result } = renderSWR({ request: requestFor('page=1') }, ({ children }) => (
        <QubeeFetchProvider fetcher={fetcher}>
          <Cache>{children}</Cache>
        </QubeeFetchProvider>
      ));

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should prefer its own fetcher to the provider's", async () => {
      const provided = createFetcher();
      const own = createFetcher();
      const { result } = renderSWR(
        { options: { fetcher: own }, request: requestFor('page=1') },
        ({ children }) => (
          <QubeeFetchProvider fetcher={provided}>
            <Cache>{children}</Cache>
          </QubeeFetchProvider>
        )
      );

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));

      expect(own).toHaveBeenCalledTimes(1);
      expect(provided).not.toHaveBeenCalled();
    });

    it('should use the global fetch when it has neither', async () => {
      const globalFetch = createFetcher();

      vi.stubGlobal('fetch', globalFetch);

      const { result } = renderSWR({ request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));

      expect(globalFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("SWR's own configuration", () => {
    it('should show the fallback data on the first render', () => {
      const fallbackData = pageOf(1);
      const { result } = renderSWR({
        options: { fallbackData, fetcher: createFetcher() },
        request: requestFor('page=1'),
      });

      expect(result.current.data).toBe(fallbackData);
    });

    it('should not fetch when SWR is told not to revalidate on mount', async () => {
      const fetcher = createFetcher();

      renderSWR({
        options: { fallbackData: pageOf(1), fetcher, revalidateOnMount: false },
        request: requestFor('page=1'),
      });

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch again when mutate is called', async () => {
      const fetcher = createFetcher();
      const { result } = renderSWR({ options: { fetcher }, request: requestFor('page=1') });

      await waitFor(() => expect(result.current.data).toEqual(pageOf(1)));
      await act(() => result.current.mutate());

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should report a status that is not ok as a QubeeFetchError', async () => {
      const { result } = renderSWR({
        options: { fetcher: createFetcher({ status: 503 }) },
        request: requestFor('page=1'),
      });

      await waitFor(() => expect(result.current.error).toBeInstanceOf(QubeeFetchError));

      expect(result.current.error).toMatchObject({ status: 503 });
    });
  });
});
