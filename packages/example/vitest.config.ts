import path from 'path';
import { mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, {
  resolve: {
    alias: {
      '@visactor/vdataset': path.resolve(__dirname, 'src/__tests__/stubs/vdataset.ts'),
      '@visactor/vseed': path.resolve(__dirname, 'src/__tests__/stubs/vseed.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__tests__/test-setup.ts'],
    testTimeout: 20_000,
  },
});
