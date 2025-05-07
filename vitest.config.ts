import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8', // 'istanbul' or 'v8'
      exclude: [
        ...configDefaults.exclude,
        '_notes/**',
        'src/**',
        'demo/**',
        '.eslintrc.js',
        'lib/types.ts',
        'lib/vite-env.d.ts',
      ],
    },
  },
});
