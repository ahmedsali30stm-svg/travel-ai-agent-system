import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'tests/**/*.test.ts',
        'src/types/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@services': path.resolve(__dirname, './src/services'),
      '@agents': path.resolve(__dirname, './src/agents'),
      '@memory': path.resolve(__dirname, './src/memory'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@schemas': path.resolve(__dirname, './src/schemas'),
    },
  },
});
