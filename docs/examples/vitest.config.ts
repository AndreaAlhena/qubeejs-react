import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Runs the testing samples the Testing guide and recipes show, against the
 * repository's own build. The root is the repository, so React and Testing
 * Library resolve to its single copy (`dedupe`), and `@qubeejs/react` to its
 * `dist/` — the package exactly as published.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@qubeejs/react': fileURLToPath(new URL('../../dist/index.js', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['docs/examples/**/*.test.tsx'],
  },
});
