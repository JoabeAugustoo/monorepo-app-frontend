import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    watch: {
      ignored: ['!**/packages/**'],
    },
  },
  resolve: {
    alias: {
      '@app/core': path.resolve(__dirname, '../../packages/core/src'),
      '@app/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
