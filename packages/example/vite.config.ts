import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@report-designer/core': path.resolve(__dirname, '../core/src'),
      '@report-designer/designer': path.resolve(__dirname, '../designer/src'),
      '@report-designer/viewer': path.resolve(__dirname, '../viewer/src'),
    },
  },
});
