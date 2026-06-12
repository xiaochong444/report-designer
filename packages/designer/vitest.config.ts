import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@report-designer/core': path.resolve(__dirname, '../core/src'),
      '@visactor/vchart': path.resolve(__dirname, 'src/__tests__/stubs/vchart.ts'),
      '@visactor/vdataset': path.resolve(__dirname, 'src/__tests__/stubs/vdataset.ts'),
      '@visactor/vseed': path.resolve(__dirname, 'src/__tests__/stubs/vseed.ts'),
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
