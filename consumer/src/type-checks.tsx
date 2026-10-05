// What the published types promise a user: these must compile, and each
// `@ts-expect-error` line must be an error (tsc fails if one is not).
import type {
  AdapterNavigateOptions,
  AdapterProviderProps,
  RouterAdapter,
  QubeeListArgs,
  QubeeListHandle,
  QubeeListRequest,
  QubeeFetcher as MainQubeeFetcher,
  QubeeFetchProviderProps,
  QubeeHandle,
  QubeeProviderProps,
  QubeeQueryOptions,
  QubeeQueryResult,
  ListSetOptions,
  MemoryAdapterProps,
  SortToggle,
} from '@qubeejs/react';

import type { ListDefinition, ListParams, ListRequest, PaginatedResult } from '@qubeejs/core';

import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';
import {
  BrowserAdapter,
  createAdapterProvider,
  MemoryAdapter,
  QubeeFetchError as MainQubeeFetchError,
  QubeeFetchProvider,
  QubeeProvider,
  useBrowserAdapter,
  useMemoryAdapter,
  useQubee,
  useQubeeList,
  useQubeeQuery,
} from '@qubeejs/react';

import type { QubeeFetcher } from '@qubeejs/react/fetch';
import type { NextAdapterOptions, NextAdapterProps } from '@qubeejs/react/next';
import type {
  ReactRouterAdapterOptions,
  ReactRouterAdapterProps,
} from '@qubeejs/react/react-router';
import type { QubeeSWROptions } from '@qubeejs/react/swr';
import type { QubeeQueryKey } from '@qubeejs/react/tanstack-query';
import type {
  TanStackRouterAdapterOptions,
  TanStackRouterAdapterProps,
} from '@qubeejs/react/tanstack-router';

import { fetchQubeePage, QubeeFetchError } from '@qubeejs/react/fetch';
import { NextAdapter, useNextAdapter } from '@qubeejs/react/next';
import { ReactRouterAdapter, useReactRouterAdapter } from '@qubeejs/react/react-router';
import { useQubeeSWR } from '@qubeejs/react/swr';
import { qubeeQueryOptions } from '@qubeejs/react/tanstack-query';
import {
  parseSearch,
  stringifySearch,
  TanStackRouterAdapter,
  useTanStackRouterAdapter,
} from '@qubeejs/react/tanstack-router';
import { keepPreviousData, QueryClient, useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { articleList, tagList } from './article-list.js';
import { ArticleStatusEnum } from './article-status.enum.js';
import { taskList } from './task-list.js';

type Article = { id: number; title: string };

export function Checks(): null {
  const router: RouterAdapter = useBrowserAdapter();
  const list = useQubeeList(articleList, router);
  const tags = useQubeeList(tagList, router);

  // State is typed from the list definition.
  const page: number = list.state.page;
  const status: ArticleStatusEnum | undefined = list.state.status;
  const uri: string = list.request.uri;
  const pending: boolean = list.isPending;
  const href: string = list.href({ page: 3, status: ArticleStatusEnum.DRAFT });

  list.set({ q: 'react' }, { debounce: 300, replace: true });
  list.set({ status: ArticleStatusEnum.PUBLISHED });
  list.setPage(2, { replace: true });
  list.toggleSort('title', { multiple: true });
  list.toggleSort('publishedAt');

  // @ts-expect-error — `nope` is not a param of the list
  list.set({ nope: 1 });
  // @ts-expect-error — page is a number
  list.set({ page: 'two' });
  // @ts-expect-error — status must be a member of the enum
  list.set({ status: 'archived' });
  // @ts-expect-error — `author` is not one of the sortParam's fields
  list.toggleSort('author');
  // @ts-expect-error — a list with no sortParam has no toggleSort
  tags.toggleSort('name');
  // @ts-expect-error — setPage takes no debounce
  list.setPage(2, { debounce: 100 });

  // The handle can be destructured (members are properties, not methods).
  const { set, setPage, toggleSort } = list;

  set({ q: undefined });
  setPage(1);
  toggleSort('title');

  // The exported types are usable by name.
  const handle: QubeeListHandle<typeof articleList> = list;
  const options: ListSetOptions = { debounce: 100 };
  const navigateOptions: AdapterNavigateOptions = { replace: false };
  const custom: RouterAdapter = {
    navigate: (target: string, { replace }: AdapterNavigateOptions): void => {
      void target;
      void replace;
    },
    pathname: '/articles',
    search: new URLSearchParams('page=2'),
  };
  const withRecord: RouterAdapter = { ...custom, search: { page: '2', tag: ['a', 'b'] } };
  const withString: RouterAdapter = { ...custom, search: '?page=2' };
  const sortToggle: SortToggle<typeof tagList> = {};
  const qubee: QubeeHandle = useQubee({ driver: STRAPI_DRIVER });
  const props: QubeeProviderProps = {
    children: null,
    value: createQubee({ driver: STRAPI_DRIVER }),
  };

  void [page, status, uri, pending, href, handle, options, navigateOptions, withRecord, withString];
  // The adapter is optional: a provider can supply it.
  const provided = useQubeeList(articleList);
  const providerProps: AdapterProviderProps = { children: null };
  const CustomAdapter = createAdapterProvider(useBrowserAdapter);

  void [sortToggle, qubee, props, QubeeProvider, provided, providerProps, BrowserAdapter];
  // In-memory lists, and reset().
  const inMemory = useQubeeList(tagList, useMemoryAdapter({ tagPage: '2' }));
  const memoryProps: MemoryAdapterProps = { children: null, initialSearch: 'tagPage=2' };

  list.reset();
  list.reset({ replace: true });
  // @ts-expect-error — reset() takes no debounce
  list.reset({ debounce: 100 });

  void [CustomAdapter, inMemory, memoryProps, MemoryAdapter];

  // The router entries: each hook returns a RouterAdapter and takes `scroll`, each provider
  // takes children and `scroll`.
  const reactRouterOptions: ReactRouterAdapterOptions = { scroll: true };
  const viaReactRouter: RouterAdapter = useReactRouterAdapter(reactRouterOptions);
  const reactRouterProps: ReactRouterAdapterProps = { children: null, scroll: true };
  const tanStackRouterOptions: TanStackRouterAdapterOptions = { scroll: true };
  const viaTanStackRouter: RouterAdapter = useTanStackRouterAdapter(tanStackRouterOptions);
  const tanStackRouterProps: TanStackRouterAdapterProps = { children: null, scroll: true };
  const nextOptions: NextAdapterOptions = { scroll: true };
  const viaNext: RouterAdapter = useNextAdapter(nextOptions);
  const nextProps: NextAdapterProps = { children: null, scroll: true };
  const routerProps: AdapterProviderProps = { children: null };

  // @ts-expect-error — the Next adapter has no such option
  useNextAdapter({ shallow: true });

  void [viaReactRouter, viaTanStackRouter, viaNext, nextProps, routerProps];
  void [reactRouterProps, tanStackRouterProps, useReactRouterAdapter(), useTanStackRouterAdapter()];
  void [NextAdapter, ReactRouterAdapter, TanStackRouterAdapter];

  // The search serialisers fit TanStack Router's options.
  const parsed: Record<string, string | string[]> = parseSearch('?q=10+');
  const written: string = stringifySearch(parsed);

  void [written];

  // Built-in fetching: the hook takes the list's request, or null, and types the rows.
  const fetcher: MainQubeeFetcher = (address, init) => fetch(address, init);
  const queryOptions: QubeeQueryOptions<Article> = {
    enabled: true,
    fetcher,
    initialData: undefined,
    keepPreviousData: false,
  };
  const articles: QubeeQueryResult<Article> = useQubeeQuery<Article>(list.request, queryOptions);
  const nothing = useQubeeQuery<Article>(null);
  const firstTitle: string | undefined = articles.data?.data[0]?.title;
  const failure: Error | undefined = articles.error;
  const flags: boolean[] = [articles.isFetching, articles.isLoading];
  const fetchProviderProps: QubeeFetchProviderProps = { children: null, fetcher };

  articles.refetch();

  if (failure instanceof MainQubeeFetchError) {
    void failure.status;
  }

  // @ts-expect-error — the built-in hook has no retries: use the TanStack Query or SWR entry
  useQubeeQuery<Article>(list.request, { retry: 3 });
  // @ts-expect-error — the provider needs a fetcher
  void ({ children: null } satisfies QubeeFetchProviderProps);

  void [nothing, firstTitle, flags, fetchProviderProps, QubeeFetchProvider];

  return null;
}

/** The fetch entry: callable outside React, with the app's own fetcher. */
export async function fetchChecks(list: QubeeListHandle<typeof articleList>): Promise<void> {
  const authFetch: QubeeFetcher = (uri, init) =>
    fetch(uri, { ...init, headers: { ...init.headers, Authorization: 'Bearer token' } });
  const globalFetch: QubeeFetcher = fetch;
  const page: PaginatedResult<Article> = await fetchQubeePage<Article>(list.request, {
    fetcher: authFetch,
    signal: new AbortController().signal,
  });
  const title: string = page.data[0].title;
  const lastPage: number | null = page.lastPage;

  try {
    await fetchQubeePage(list.request);
  } catch (error) {
    if (error instanceof QubeeFetchError) {
      const status: number = error.status;
      const response: Response = error.response;

      void [status, response, error.uri];
    }
  }

  // @ts-expect-error — a request is required
  void fetchQubeePage();
  // @ts-expect-error — a fetcher returns a Response
  void fetchQubeePage(list.request, { fetcher: () => Promise.resolve({ data: [] }) });

  void [globalFetch, title, lastPage];
}

/** The TanStack Query entry: its options fit TanStack's hooks and its client, with typed data. */
export function QueryChecks({ list }: { list: QubeeListHandle<typeof articleList> }): null {
  const client = new QueryClient();
  const options = qubeeQueryOptions<Article>(list.request);
  const key: QubeeQueryKey = options.queryKey;
  const query = useQuery({ ...options, placeholderData: keepPreviousData });
  const data: PaginatedResult<Article> | undefined = query.data;
  const suspended: PaginatedResult<Article> = useSuspenseQuery(options).data;
  const maybe = list.isPending ? null : list.request;
  const skipped = useQuery(qubeeQueryOptions<Article>(maybe));
  const cached: PaginatedResult<Article> | undefined = client.getQueryData(options.queryKey);

  void client.prefetchQuery(options);
  void client.ensureQueryData(qubeeQueryOptions<Article>(list.request, { fetcher: fetch }));

  // @ts-expect-error — a query that may be skipped cannot suspend
  useSuspenseQuery(qubeeQueryOptions<Article>(maybe));

  void [key, data, suspended, skipped.data, cached];

  return null;
}

/** Generic code forwards the arguments, so its callers stay checked. */
function useTaskTable<T extends ListDefinition<ListParams>>(
  list: T,
  ...args: QubeeListArgs<T>
): QubeeListHandle<T> {
  return useQubeeList(list, ...args);
}

/** A list with an input: required, `null` while not ready, and a request that may be `null`. */
export function InputChecks({ projectId }: { projectId: string | undefined }): null {
  const router: RouterAdapter = useBrowserAdapter();
  const tasks = useQubeeList(taskList, { projectId: '42' });
  const waiting = useQubeeList(taskList, projectId ? { projectId } : null, router);
  const request: ListRequest | null = tasks.request;
  const named: QubeeListRequest<typeof taskList> = waiting.request;
  const always: ListRequest = useQubeeList(articleList).request;
  const fetched = useQubeeQuery<Article>(tasks.request);
  const swr = useQubeeSWR<Article>(waiting.request);
  const query = useQuery(qubeeQueryOptions<Article>(tasks.request));
  const forwarded = useTaskTable(taskList, { projectId: '42' });

  // @ts-expect-error — taskList declares an input: pass it, or null while it is not ready
  useQubeeList(taskList);
  // @ts-expect-error — articleList declares no input
  useQubeeList(articleList, { projectId: '42' });
  // @ts-expect-error — the request is null while the input is: check it before fetching
  void fetchQubeePage(tasks.request);
  // @ts-expect-error — the wrapper requires the input too
  useTaskTable(taskList);

  void [request, named, always, fetched.data, swr.data, query.data, forwarded.state.page];

  return null;
}

/** The SWR entry: SWR's configuration with a qubee fetcher, and SWR's response with typed data. */
export function SwrChecks({ list }: { list: QubeeListHandle<typeof articleList> }): null {
  const options: QubeeSWROptions<Article> = {
    fetcher: (uri, init) => fetch(uri, init),
    keepPreviousData: false,
    revalidateOnFocus: false,
  };
  const articles = useQubeeSWR<Article>(list.request, options);
  const data: PaginatedResult<Article> | undefined = articles.data;
  const failure: Error | undefined = articles.error;
  const nothing = useQubeeSWR<Article>(null);

  void articles.mutate();

  // @ts-expect-error — the fetcher returns a Response, as fetch does, not the data
  useQubeeSWR<Article>(list.request, { fetcher: (key: string) => Promise.resolve([key]) });

  void [data, failure, articles.isLoading, articles.isValidating, nothing.data];

  return null;
}
