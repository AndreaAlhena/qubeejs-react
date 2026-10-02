// The app in a browser-like page (jsdom): real clicks and typing, the real history API.
import { JSDOM } from 'jsdom';
import type { ReactElement } from 'react';

import { act, StrictMode, version } from 'react';

import { check, finish } from './report.js';

type State = {
  page: number;
  q?: string;
  sort: { field: string; order: string }[];
  status?: string;
};

async function main(): Promise<void> {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div><div id="hydrated"></div></body></html>',
    {
      pretendToBeVisual: true,
      url: 'https://app.test/articles?q=old&page=3&utm=keep',
    }
  );
  const { window } = dom;
  const globals = globalThis as Record<string, unknown>;

  globals.window = window;
  globals.document = window.document;
  globals.HTMLElement = window.HTMLElement;
  globals.HTMLIFrameElement = window.HTMLIFrameElement;
  globals.IS_REACT_ACT_ENVIRONMENT = true;

  const errors: string[] = [];
  const originalError = console.error;

  console.error = (...parts: unknown[]): void => {
    errors.push(parts.map(String).join(' ').slice(0, 300));
  };

  const { createRoot, hydrateRoot } = await import('react-dom/client');
  const { renderToString } = await import('react-dom/server');
  const { App, Articles, asked, swrAsked } = await import('./app.js');

  const rootElement = window.document.getElementById('root') as HTMLElement;
  const within = (scope: Element, id: string): HTMLElement =>
    scope.querySelector(`#${id}`) as HTMLElement;
  const $ = (id: string): HTMLElement => within(rootElement, id);
  const text = (id: string): string => $(id).textContent ?? '';
  const state = (): State => JSON.parse(text('state')) as State;
  const search = (): URLSearchParams => new URLSearchParams(window.location.search);
  // A fetch started by an interaction is answered a few ticks later: waiting for it inside
  // `act` keeps React's "not wrapped in act" warning for updates that really are stray.
  const answered = (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  const click = (id: string): Promise<void> =>
    act(async () => {
      $(id).dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
      await answered();
    });
  const wait = (ms: number): Promise<void> =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await answered();
    });
  const type = (value: string): Promise<void> =>
    act(async () => {
      const input = $('q') as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      setter?.call(input, value);
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });

  const trace: string[] = [];
  const strict = process.env.STRICT === '1';
  const wrap = (element: ReactElement): ReactElement =>
    strict ? <StrictMode>{element}</StrictMode> : element;
  const root = createRoot(rootElement);

  await act(async () => {
    root.render(wrap(<App />));
    await answered();
  });

  // A — the first render reads the URL.
  check('A1 state comes from the URL', state().q === 'old' && state().page === 3, state());
  check('A2 a second component reading the same list agrees', text('label') === '3', text('label'));
  check('A3 the request targets the resource', text('uri').includes('articles'), text('uri'));
  check('A4 nothing is pending at rest', text('pending') === 'false', text('pending'));

  const link = new URL(($('link') as HTMLAnchorElement).href, 'https://app.test');

  check(
    'A5 href() keeps the query, the foreign param, and applies the change',
    link.searchParams.get('page') === '2' &&
      link.searchParams.get('q') === 'old' &&
      link.searchParams.get('utm') === 'keep',
    link.search
  );
  check(
    'A6 an unsorted column reports aria-sort none',
    $('th').getAttribute('aria-sort') === 'none',
    $('th').getAttribute('aria-sort') ?? 'null'
  );

  // Q — the built-in fetching hook, through the provider's fetcher.
  check(
    'Q1 useQubeeQuery fetched the page the URL asks for',
    asked.at(-1) === text('uri') && text('rows') === `Row ${asked.length}`,
    { asked, rows: text('rows') }
  );
  check(
    'Q2 the page is parsed by the driver',
    text('lastpage') === '3' && text('fetching') === 'false',
    { fetching: text('fetching'), lastPage: text('lastpage') }
  );

  check(
    'Q5 useQubeeSWR, from its own entry, fetches through the provider of the main entry',
    swrAsked.at(-1) === text('uri') && text('swrrows') === 'From SWR',
    { rows: text('swrrows'), swrAsked }
  );

  // B — typing with a debounce.
  const askedBefore = asked.length;
  const uriBefore = text('uri');
  const lengthBefore = window.history.length;

  await type('react');

  check(
    'B1 the input shows the typed text at once',
    ($('q') as HTMLInputElement).value === 'react',
    ($('q') as HTMLInputElement).value
  );
  check('B2 state updates at once', state().q === 'react', state());
  check(
    'B3 isPending is true while the debounce waits',
    text('pending') === 'true',
    text('pending')
  );
  check('B4 the URL has not changed yet', search().get('q') === 'old', window.location.search);
  check('B5 the request has not changed yet', text('uri') === uriBefore, text('uri'));
  check('Q3 nothing is fetched while the debounce waits', asked.length === askedBefore, asked);

  await wait(450);
  trace.push(
    'after typing   ' + window.location.pathname + window.location.search + '   uri=' + text('uri')
  );

  check(
    'B6 after the debounce the URL has the new query',
    search().get('q') === 'react',
    window.location.search
  );
  check(
    'Q4 after the debounce the new request is fetched, once it is committed',
    asked.at(-1) === text('uri') &&
      text('uri') !== uriBefore &&
      text('rows') === `Row ${asked.length}` &&
      text('fetching') === 'false',
    { asked, rows: text('rows') }
  );
  check(
    'B7 a filter change returns to page 1',
    !search().has('page') && state().page === 1,
    window.location.search
  );
  check('B8 the foreign param survives', search().get('utm') === 'keep', window.location.search);
  check(
    'B9 replace: true added no history entry',
    window.history.length === lengthBefore,
    `${lengthBefore} -> ${window.history.length}`
  );
  check(
    'B10 the request follows the committed state',
    text('uri') !== uriBefore && text('uri').includes('react'),
    text('uri')
  );
  check('B11 isPending is false again', text('pending') === 'false', text('pending'));
  check('B12 the other reader followed', text('label') === '1', text('label'));

  // C — sorting.
  await click('sort');
  trace.push(
    'after sort     ' + window.location.pathname + window.location.search + '   uri=' + text('uri')
  );

  check(
    'C1 the column reports ascending',
    $('th').getAttribute('aria-sort') === 'ascending',
    $('th').getAttribute('aria-sort') ?? 'null'
  );
  check(
    'C2 the sort is in the URL',
    (search().get('sort') ?? '').includes('title'),
    window.location.search
  );
  check(
    'C3 a push added one history entry',
    window.history.length === lengthBefore + 1,
    `${lengthBefore} -> ${window.history.length}`
  );
  check(
    'C4 the request carries the sort',
    decodeURIComponent(text('uri')).includes('title'),
    text('uri')
  );

  await click('sort');

  check(
    'C5 a second click flips to descending',
    $('th').getAttribute('aria-sort') === 'descending',
    $('th').getAttribute('aria-sort') ?? 'null'
  );

  // D — paging.
  await click('page2');
  trace.push(
    'after page 2   ' + window.location.pathname + window.location.search + '   uri=' + text('uri')
  );

  check(
    'D1 setPage writes the page',
    search().get('page') === '2' && state().page === 2,
    window.location.search
  );
  check('D2 the other reader followed', text('label') === '2', text('label'));
  check(
    'D3 paging kept the query and the sort',
    search().get('q') === 'react' && search().has('sort'),
    window.location.search
  );

  // E — the Back button.
  await act(async () => {
    window.history.back();
    await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
  });

  check(
    'E1 Back returns the state to page 1',
    state().page === 1 && text('label') === '1',
    `${JSON.stringify(state())} label=${text('label')}`
  );
  check('E2 Back left nothing pending', text('pending') === 'false', text('pending'));

  // F — a second list on the same page.
  await click('tagnext');
  trace.push(
    'after tags     ' + window.location.pathname + window.location.search + '   uri=' + text('uri')
  );

  check(
    'F1 the second list writes its own param',
    search().get('tagPage') === '2' && $('tagnext').textContent === 'Tags page 2',
    window.location.search
  );
  check(
    'F2 and leaves the first list alone',
    search().get('q') === 'react' && state().q === 'react' && state().page === 1,
    window.location.search
  );

  // G — clearing filters.
  await click('clear');
  trace.push(
    'after clear    ' + window.location.pathname + window.location.search + '   uri=' + text('uri')
  );

  check(
    'G1 undefined returns a param to its default',
    !search().has('q') && state().q === undefined,
    window.location.search
  );
  check(
    'G2 clearing kept the other list and the foreign param',
    search().get('tagPage') === '2' && search().get('utm') === 'keep',
    window.location.search
  );

  // H, I — in-memory instances.
  await click('picker');

  check(
    'H1 useQubee re-renders on a builder call',
    $('picker').textContent === 'Page 2',
    $('picker').textContent ?? ''
  );

  await click('filter');

  check(
    'I1 a sibling under the provider sees the write',
    text('shared').includes('published'),
    text('shared')
  );

  // M — a list in memory, under its own provider.
  const urlBeforeDialog = window.location.search;

  check(
    'M1 the in-memory list starts from its initial search',
    text('dialoglabel') === '3',
    text('dialoglabel')
  );

  await click('dialognext');

  check('M2 its components share one state', text('dialoglabel') === '4', text('dialoglabel'));
  check(
    'M3 and the page URL does not change',
    window.location.search === urlBeforeDialog,
    window.location.search
  );
  check(
    'M4 nor does the URL list with the same definition',
    $('tagnext').textContent === 'Tags page 2',
    $('tagnext').textContent ?? ''
  );

  await click('dialogreset');

  check('M5 reset() returns it to its default', text('dialoglabel') === '1', text('dialoglabel'));

  // J — hydration of server-rendered markup at a URL with params.
  const hydrated = window.document.getElementById('hydrated') as HTMLElement;
  const errorsBeforeHydration = errors.length;

  window.history.replaceState(null, '', '/articles?q=ssr&page=4');
  hydrated.innerHTML = renderToString(wrap(<Articles />));

  const serverState = JSON.parse(within(hydrated, 'state').textContent ?? '{}') as State;
  let hydratedRoot: ReturnType<typeof hydrateRoot> | undefined;

  await act(async () => {
    hydratedRoot = hydrateRoot(hydrated, wrap(<Articles />));
  });

  const clientState = JSON.parse(within(hydrated, 'state').textContent ?? '{}') as State;

  check(
    'J1 the server markup holds the defaults',
    serverState.page === 1 && serverState.q === undefined,
    serverState
  );
  check(
    'J2 after hydration the client shows the URL state',
    clientState.page === 4 && clientState.q === 'ssr',
    clientState
  );
  check(
    'J3 hydration logged no error',
    errors.length === errorsBeforeHydration,
    errors.slice(errorsBeforeHydration)
  );

  // K — a pending debounce is dropped on unmount.
  await type('gone');
  await act(async () => {
    root.unmount();
    hydratedRoot?.unmount();
  });
  await wait(450);

  check(
    'K1 unmounting cancels the pending debounce',
    search().get('q') !== 'gone',
    window.location.search
  );
  check('K2 React logged no error or warning in the whole run', errors.length === 0, errors);

  console.error = originalError;
  console.log(`${trace.join('\n')}\n`);
  finish(`Client (React ${version}${strict ? ', StrictMode' : ''})`);
}

main().catch((error: unknown) => {
  console.log('CRASH', error);
  process.exitCode = 1;
});
