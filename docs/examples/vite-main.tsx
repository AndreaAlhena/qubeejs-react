import { STRAPI_DRIVER } from '@qubeejs/core';
import { QubeeProvider } from '@qubeejs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

const root = document.getElementById('root');

if (!root) {
  throw new Error('index.html has no #root element');
}

createRoot(root).render(
  <StrictMode>
    <QubeeProvider baseUrl="https://example.com/api" driver={STRAPI_DRIVER}>
      <App />
    </QubeeProvider>
  </StrictMode>
);
