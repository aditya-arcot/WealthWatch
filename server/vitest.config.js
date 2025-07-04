import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts'],
        coverage: {
            include: ['src/utilities/**/*.ts'],
            all: true,
        },
    },
    plugins: [tsconfigPaths()],
})
