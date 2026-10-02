// Server rendering in plain Node: no window, no document.
import { MissingQubeeProviderError, MissingRouterAdapterError } from '@qubeejs/react';
import { version } from 'react';
import { renderToString } from 'react-dom/server';

import { App, NoAdapter, Orphan } from './app.js';
import { check, finish } from './report.js';

const hasWindow = typeof (globalThis as { window?: unknown }).window !== 'undefined';
let html = '';
let renderError: unknown;

try {
  html = renderToString(<App />);
} catch (error) {
  renderError = error;
}

check('there is no window in this process', !hasWindow);
check(
  'the whole app renders on the server without throwing',
  renderError === undefined,
  String(renderError)
);
check('useQubee renders the initial page', /Page (<!-- -->)?1/.test(html), html.slice(0, 200));
check(
  'useQubeeList renders the list defaults',
  html.includes('Tags page') && html.includes('id="state"'),
  html
);
check('the server request targets the resource', /id="uri">[^<]*articles/.test(html), html);

let thrown: unknown;

try {
  renderToString(<Orphan />);
} catch (error) {
  thrown = error;
}

check(
  'useQubeeContext outside a provider throws MissingQubeeProviderError',
  thrown instanceof MissingQubeeProviderError,
  String(thrown)
);

let missing: unknown;

try {
  renderToString(<NoAdapter />);
} catch (error) {
  missing = error;
}

check(
  'useQubeeList with no adapter throws MissingRouterAdapterError',
  missing instanceof MissingRouterAdapterError,
  String(missing)
);

finish(`SSR (React ${version})`);
