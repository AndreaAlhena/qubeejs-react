import { BrowserAdapter } from '@qubeejs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

const root = document.getElementById('root');

if (!root) {
  throw new Error('index.html has no #root element');
}

// Every list below the provider reads and writes the URL through browser history.
createRoot(root).render(
  <StrictMode>
    <BrowserAdapter>
      <App />
    </BrowserAdapter>
  </StrictMode>
);
