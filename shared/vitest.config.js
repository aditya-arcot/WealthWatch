import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/utilities/*.test.ts'],
        coverage: {
            include: ['src/utilities/*.ts'],
        },
    },
})
