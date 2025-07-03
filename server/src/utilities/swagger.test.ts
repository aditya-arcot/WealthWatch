import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnvNameEnum } from '../wealthwatch-shared.js'

beforeEach(() => vi.resetModules())

describe('swaggerUiOptions', () => {
    const mockCsrfToken = 'mock-csrf-token'
    const expectSwaggerUiOptions = async (url = 'localhost', port = 3000) => {
        global.fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ csrfToken: mockCsrfToken }),
        })

        const { swaggerUiOptions } = await import('./swagger.js')
        const req = { url, headers: {} }
        const result =
            await swaggerUiOptions.swaggerOptions?.['requestInterceptor']?.(req)

        const csrfUrl = `http://localhost:${port}/csrf-token`
        expect(global.fetch).toHaveBeenCalledWith(csrfUrl)
        expect(result.headers['x-csrf-token']).toBe(mockCsrfToken)
    }

    it('injects csrf token into request headers for default port', async () => {
        await expectSwaggerUiOptions()
    })

    it('injects csrf token into request headers for custom port', async () => {
        await expectSwaggerUiOptions('http://localhost:4000', 4000)
    })
})

describe('createSwaggerSpec', () => {
    it('returns valid swagger spec for non-prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Dev
        const { createSwaggerSpec } = await import('./swagger.js')
        const spec = createSwaggerSpec()
        expect(spec).toBeDefined()
    })

    it('throws error for prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { createSwaggerSpec } = await import('./swagger.js')
        expect(() => createSwaggerSpec()).toThrow(
            'swagger should not be used in production'
        )
    })
})
