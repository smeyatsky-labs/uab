import { defineConfig } from 'vitest/config';

// Only *.test.ts are tests. The src/infrastructure/data/*.spec.ts files are
// protocol-spec DATA (the catalog), not test files, so exclude that pattern.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
