import type { ListRequest, PaginatedResult, RawResponse } from '@qubeejs/core';
import type { ReactElement, ReactNode } from 'react';

import { buildListRequest, readListState } from '@qubeejs/core';
import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import type { QubeeFetcher } from '../types/qubee-fetcher.type';
import type { QubeeQueryOptions } from '../types/qubee-query-options.type';
import type { QubeeQueryResult } from '../types/qubee-query-result.type';

import { articleList } from '../../test/fixtures/article-list';
import { QubeeFetchProvider } from '../components/qubee-fetch-provider';
import { QubeeFetchError } from '../errors/qubee-fetch.error';
import { useQubeeQuery } from './use-qubee-query';

type ArticleRow = { id: number; title: string };

type Call = {
  reject: (reason: unknown) => void;
  resolve: (response: Response) => void;
  signal: AbortSignal | undefined;
  uri: string;
};

type Props = { options?: QubeeQueryOptions<ArticleRow>; request: ListRequest | null };

const requestFor = (search: string): ListRequest =>
  buildListRequest(articleList, readListState(articleList, search));

/** The body a Strapi API answers with for page `page`: one article, numbered after the page. */
const bodyOf = (page: number): RawResponse => ({
  data: [{ id: page, title: `Article ${page}` }],
  meta: { pagination: { page, pageCount: 3, pageSize: 20, total: 57 } },
});

/** That page as the hook returns it. */
const pageOf = (page: number): PaginatedResult<ArticleRow> =>
  requestFor(`page=${page}`).paginate<ArticleRow>(bodyOf(page)).toPlain();

/** A fetcher that leaves every request pending until the test answers it. */
function createFetcher(): { calls: Call[]; fetcher: QubeeFetcher } {
  const calls: Call[] = [];
  const fetcher: QubeeFetcher = (uri, init) =>
    new Promise<Response>((resolve, reject) => {
      calls.push({ reject, resolve, signal: init.signal, uri });
    });

  return { calls, fetcher };
}

/** Let the promises of an answered request run, and React with them. */
const settle = (): Promise<void> =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });

const answer = async (call: Call, page: number, init: ResponseInit = {}): Promise<void> => {
  call.resolve(new Response(JSON.stringify(bodyOf(page)), init));
  await settle();
};

const fail = async (call: Call, reason: unknown): Promise<void> => {
  call.reject(reason);
  await settle();
};

const renderQuery = (
  initialProps: Props,
  wrapper?: (props: { children: ReactNode }) => ReactElement
): ReturnType<typeof renderHook<QubeeQueryResult<ArticleRow>, Props>> =>
  renderHook(({ options, request }: Props) => useQubeeQuery<ArticleRow>(request, options), {
    initialProps,
    wrapper,
  });

describe('useQubeeQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the first render', () => {
    it('should be fetching from the first render when a request is due', () => {
      const { calls, fetcher } = createFetcher();
      const request = requestFor('page=1');
      const { result } = renderQuery({ options: { fetcher }, request });

      expect(result.current).toMatchObject({
        data: undefined,
        error: undefined,
        isFetching: true,
        isLoading: true,
      });
      expect(calls.map((call) => call.uri)).toEqual([request.uri]);
    });

    it('should report the same flags on the server, and fetch nothing there', () => {
      const { calls, fetcher } = createFetcher();

      function Flags(): ReactElement {
        const { isFetching, isLoading } = useQubeeQuery(requestFor('page=1'), { fetcher });

        return <output>{`${isFetching} ${isLoading}`}</output>;
      }

      expect(renderToString(<Flags />)).toBe('<output>true true</output>');
      expect(calls).toEqual([]);
    });

    it('should show the initial data without fetching', () => {
      const { calls, fetcher } = createFetcher();
      const initialData = pageOf(1);
      const { result } = renderQuery({
        options: { fetcher, initialData },
        request: requestFor('page=1'),
      });

      expect(result.current.data).toBe(initialData);
      expect(result.current).toMatchObject({ isFetching: false, isLoading: false });
      expect(calls).toEqual([]);
    });

    it('should fetch a later request although the first one had initial data', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher, initialData: pageOf(1) };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ isFetching: true, isLoading: false });
      expect(calls).toHaveLength(1);

      await answer(calls[0], 2);

      expect(result.current.data).toEqual(pageOf(2));
    });

    it('should fetch the first request when the list comes back to it', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher, initialData: pageOf(1) };
      const { rerender } = renderQuery({ options, request: requestFor('page=1') });

      rerender({ options, request: requestFor('page=2') });
      await answer(calls[0], 2);
      rerender({ options, request: requestFor('page=1') });

      expect(calls.map((call) => call.uri)).toEqual([
        requestFor('page=2').uri,
        requestFor('page=1').uri,
      ]);
    });
  });

  describe('answers', () => {
    it('should return the page when the request is answered', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });

      await answer(calls[0], 1);

      expect(result.current).toMatchObject({
        data: pageOf(1),
        error: undefined,
        isFetching: false,
        isLoading: false,
      });
    });

    it('should keep the previous page while the next one loads', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({
        data: pageOf(1),
        isFetching: true,
        isLoading: false,
      });

      await answer(calls[1], 2);

      expect(result.current).toMatchObject({ data: pageOf(2), isFetching: false });
    });

    it('should show no data while the next page loads when keepPreviousData is off', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher, keepPreviousData: false };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: undefined, isFetching: true, isLoading: true });
    });

    it('should not fetch again for a new request object that asks for the same page', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);
      rerender({ options, request: requestFor('page=1') });

      expect(result.current.isFetching).toBe(false);
      expect(calls).toHaveLength(1);
    });

    it('should fetch again when only a header changes', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const request = requestFor('');
      const { rerender } = renderQuery({
        options,
        request: { ...request, headers: { Range: '0-19' } },
      });

      await answer(calls[0], 1);
      rerender({ options, request: { ...request, headers: { Range: '20-39' } } });

      expect(calls).toHaveLength(2);
    });

    it('should abort the request it replaces, and ignore its answer', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      rerender({ options, request: requestFor('page=2') });

      expect(calls[0].signal?.aborted).toBe(true);
      expect(calls[1].signal?.aborted).toBe(false);

      await answer(calls[0], 1);

      expect(result.current).toMatchObject({ data: undefined, isFetching: true });

      await answer(calls[1], 2);

      expect(result.current.data).toEqual(pageOf(2));
    });

    it('should not report the abort of a replaced request as an error', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      rerender({ options, request: requestFor('page=2') });
      await fail(calls[0], new DOMException('The operation was aborted.', 'AbortError'));

      expect(result.current).toMatchObject({ error: undefined, isFetching: true });
    });
  });

  describe('failures', () => {
    it('should report a QubeeFetchError and discard the page of the request before', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);
      rerender({ options, request: requestFor('page=2') });
      await answer(calls[1], 2, { status: 500 });

      expect(result.current.error).toBeInstanceOf(QubeeFetchError);
      expect(result.current.error).toMatchObject({ status: 500, uri: requestFor('page=2').uri });
      expect(result.current).toMatchObject({
        data: undefined,
        isFetching: false,
        isLoading: false,
      });
    });

    it('should report what the fetcher rejected with', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });
      const offline = new TypeError('Failed to fetch');

      await fail(calls[0], offline);

      expect(result.current.error).toBe(offline);
    });

    it('should wrap a rejection that is not an Error, and keep it as the cause', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });

      await fail(calls[0], 'offline');

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        'The request was rejected with a value that is not an Error.'
      );
      expect(result.current.error?.cause).toBe('offline');
    });

    it('should drop the error when the next request starts', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await fail(calls[0], new Error('offline'));
      rerender({ options, request: requestFor('page=2') });

      expect(result.current).toMatchObject({ data: undefined, error: undefined, isLoading: true });
    });
  });

  describe('refetch', () => {
    it('should fetch the current request again, and keep its page meanwhile', async () => {
      const { calls, fetcher } = createFetcher();
      const request = requestFor('page=1');
      const { result } = renderQuery({ options: { fetcher }, request });

      await answer(calls[0], 1);
      act(() => result.current.refetch());

      expect(result.current).toMatchObject({ data: pageOf(1), isFetching: true, isLoading: false });
      expect(calls.map((call) => call.uri)).toEqual([request.uri, request.uri]);

      await answer(calls[1], 3);

      expect(result.current.data?.data[0].title).toBe('Article 3');
      expect(result.current.isFetching).toBe(false);
    });

    it('should keep the page when the refetch fails', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });
      const offline = new Error('offline');

      await answer(calls[0], 1);
      act(() => result.current.refetch());
      await fail(calls[1], offline);

      expect(result.current).toMatchObject({ data: pageOf(1), error: offline, isFetching: false });
    });

    it('should try again after a failure', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });

      await fail(calls[0], new Error('offline'));
      act(() => result.current.refetch());

      expect(result.current).toMatchObject({ isFetching: true, isLoading: true });

      await answer(calls[1], 1);

      expect(result.current).toMatchObject({ data: pageOf(1), error: undefined });
    });

    it('should give way to a new request, and ignore the answer of the refetch', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);
      act(() => result.current.refetch());
      rerender({ options, request: requestFor('page=2') });

      expect(calls[1].signal?.aborted).toBe(true);

      await answer(calls[1], 3);

      expect(result.current).toMatchObject({ data: pageOf(1), isFetching: true });

      await answer(calls[2], 2);

      expect(result.current).toMatchObject({ data: pageOf(2), isFetching: false });
    });

    it('should report a fetcher that throws instead of returning a promise', async () => {
      const broken = new Error('no token');
      const { result } = renderQuery({
        options: {
          fetcher: () => {
            throw broken;
          },
        },
        request: requestFor('page=1'),
      });

      await settle();

      expect(result.current).toMatchObject({ error: broken, isFetching: false });
    });

    it('should be the same function on every render', async () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });
      const { refetch } = result.current;

      await answer(calls[0], 1);

      expect(result.current.refetch).toBe(refetch);
    });
  });

  describe('nothing to fetch', () => {
    it('should fetch nothing for a null request', () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({ options: { fetcher }, request: null });

      expect(result.current).toMatchObject({
        data: undefined,
        error: undefined,
        isFetching: false,
        isLoading: false,
      });
      expect(calls).toEqual([]);
    });

    it('should fetch nothing when disabled, whatever the initial data', () => {
      const { calls, fetcher } = createFetcher();
      const { result } = renderQuery({
        options: { enabled: false, fetcher, initialData: pageOf(1) },
        request: requestFor('page=1'),
      });

      expect(result.current).toMatchObject({ data: undefined, isFetching: false });
      expect(calls).toEqual([]);
    });

    it('should hide the page when it is disabled, and fetch anew when enabled again', async () => {
      const { calls, fetcher } = createFetcher();
      const request = requestFor('page=1');
      const { rerender, result } = renderQuery({ options: { fetcher }, request });

      await answer(calls[0], 1);
      rerender({ options: { enabled: false, fetcher }, request });

      expect(result.current).toMatchObject({ data: undefined, isFetching: false });

      rerender({ options: { enabled: true, fetcher }, request });

      expect(result.current).toMatchObject({ data: undefined, isFetching: true, isLoading: true });
      expect(calls).toHaveLength(2);
    });

    it('should abort the request in flight when it is disabled', () => {
      const { calls, fetcher } = createFetcher();
      const { rerender } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });

      rerender({ options: { fetcher }, request: null });

      expect(calls[0].signal?.aborted).toBe(true);
    });
  });

  describe('the fetcher', () => {
    it("should use the nearest provider's fetcher", () => {
      const outer = createFetcher();
      const inner = createFetcher();

      renderQuery({ request: requestFor('page=1') }, ({ children }) => (
        <QubeeFetchProvider fetcher={outer.fetcher}>
          <QubeeFetchProvider fetcher={inner.fetcher}>{children}</QubeeFetchProvider>
        </QubeeFetchProvider>
      ));

      expect(inner.calls).toHaveLength(1);
      expect(outer.calls).toEqual([]);
    });

    it("should prefer its own fetcher to the provider's", () => {
      const provided = createFetcher();
      const own = createFetcher();

      renderQuery({ options: { fetcher: own.fetcher }, request: requestFor('page=1') }, (props) => (
        <QubeeFetchProvider fetcher={provided.fetcher}>{props.children}</QubeeFetchProvider>
      ));

      expect(own.calls).toHaveLength(1);
      expect(provided.calls).toEqual([]);
    });

    it('should use the global fetch when it has neither', async () => {
      const globalFetch = vi.fn<QubeeFetcher>(() =>
        Promise.resolve(new Response(JSON.stringify(bodyOf(1))))
      );
      const request = requestFor('page=1');

      vi.stubGlobal('fetch', globalFetch);

      const { result } = renderQuery({ request });

      await settle();

      expect(globalFetch.mock.calls[0][0]).toBe(request.uri);
      expect(result.current.data).toEqual(pageOf(1));
    });

    it('should not fetch again when the fetcher changes, and use the new one from then on', async () => {
      const first = createFetcher();
      const second = createFetcher();
      const { rerender } = renderQuery({
        options: { fetcher: first.fetcher },
        request: requestFor('page=1'),
      });

      await answer(first.calls[0], 1);
      rerender({ options: { fetcher: second.fetcher }, request: requestFor('page=1') });

      expect(first.calls).toHaveLength(1);
      expect(second.calls).toEqual([]);

      rerender({ options: { fetcher: second.fetcher }, request: requestFor('page=2') });

      expect(second.calls.map((call) => call.uri)).toEqual([requestFor('page=2').uri]);
    });
  });

  describe('the life of the component', () => {
    it('should abort the request in flight when it unmounts', () => {
      const { calls, fetcher } = createFetcher();
      const { unmount } = renderQuery({ options: { fetcher }, request: requestFor('page=1') });

      unmount();

      expect(calls[0].signal?.aborted).toBe(true);
    });

    it('should show one request state under StrictMode', async () => {
      const { calls, fetcher } = createFetcher();
      const seen: boolean[] = [];
      const { result } = renderHook(
        () => {
          const query = useQubeeQuery<ArticleRow>(requestFor('page=1'), { fetcher });

          seen.push(query.isFetching);

          return query;
        },
        { wrapper: StrictMode }
      );

      // StrictMode mounts the effect twice: the first request is aborted, the second stands.
      expect(calls.map((call) => call.signal?.aborted)).toEqual([true, false]);
      expect(new Set(seen)).toEqual(new Set([true]));

      await answer(calls[0], 1);

      expect(result.current.isFetching).toBe(true);

      await answer(calls[1], 1);

      expect(result.current).toMatchObject({ data: pageOf(1), isFetching: false });
    });

    it('should return the same object while nothing changes', async () => {
      const { calls, fetcher } = createFetcher();
      const options = { fetcher };
      const { rerender, result } = renderQuery({ options, request: requestFor('page=1') });

      await answer(calls[0], 1);

      const before = result.current;

      rerender({ options, request: requestFor('page=1') });

      expect(result.current).toBe(before);
    });
  });
});
