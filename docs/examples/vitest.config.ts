import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Runs the testing samples the Testing guide and recipes show, against the
 * repository's own build. The root is the repository, so React, Testing Library
 * and TanStack Router resolve to its single copy (`dedupe`), and `@qubeejs/react`
 * to its `dist/` — the package exactly as published.
 */
export default defineConfig({
  resolve: {
    alias: [
      // The other entry points: `@qubeejs/react/react-router` is dist/react-router.js.
      {
        find: /^@qubeejs\/react\/(.+)$/,
        replacement: `${fileURLToPath(new URL('../../dist/', import.meta.url))}$1.js`,
      },
      {
        find: '@qubeejs/react',
        replacement: fileURLToPath(new URL('../../dist/index.js', import.meta.url)),
      },
    ],
    dedupe: ['@tanstack/react-router', 'react', 'react-dom'],
  },
  root: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['docs/examples/**/*.test.tsx'],
  },
});
