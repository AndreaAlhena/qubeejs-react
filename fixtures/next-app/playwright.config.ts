import { defineConfig } from '@playwright/test';

const PORT = 3210;

/**
 * Drives the production build of the fixture app in an installed browser. `channel` avoids
 * downloading a browser: GitHub's runners and most machines have Chrome; set
 * PLAYWRIGHT_CHANNEL=msedge to use Edge.
 */
export default defineConfig({
  forbidOnly: true,
  reporter: 'list',
  retries: 0,
  testDir: './e2e',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
  },
  webServer: {
    command: `npx next start --port ${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    url: `http://127.0.0.1:${PORT}/articles`,
  },
  workers: 1,
});
