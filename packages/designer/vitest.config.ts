import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@report-designer/core': path.resolve(__dirname, '../core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/test-setup.ts'],
    testTimeout: 20_000,
  },
});
