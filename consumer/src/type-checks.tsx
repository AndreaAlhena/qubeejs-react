// What the published types promise a user: these must compile, and each
// `@ts-expect-error` line must be an error (tsc fails if one is not).
import type {
  AdapterNavigateOptions,
  AdapterProviderProps,
  RouterAdapter,
  QubeeListHandle,
  QubeeHandle,
  QubeeProviderProps,
  ListSetOptions,
  SortToggle,
} from '@qubeejs/react';

import { createQubee, STRAPI_DRIVER } from '@qubeejs/core';
import {
  BrowserAdapter,
  createAdapterProvider,
  QubeeProvider,
  useBrowserAdapter,
  useQubee,
  useQubeeList,
} from '@qubeejs/react';

import { articleList, tagList } from './article-list.js';
import { ArticleStatusEnum } from './article-status.enum.js';

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
  void CustomAdapter;

  return null;
}
