import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    exclude: ['node_modules', '.worktrees/**', '.next/**', 'e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
