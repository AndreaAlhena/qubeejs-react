import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      // Entry files only re-export: there is nothing in them to cover.
      exclude: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.type.ts', 'src/entries/**', 'src/index.ts'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html'],
      // Floor, not a target — these RATCHET UP, never down. The same floors as @qubeejs/core.
      thresholds: {
        branches: 97,
        functions: 99,
        lines: 98,
        statements: 98,
      },
    },
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'test/**/*.spec.ts', 'test/**/*.spec.tsx'],
  },
});
