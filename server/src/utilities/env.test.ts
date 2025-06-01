import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnvNameEnum } from 'wealthwatch-shared'
import { _test } from './env.js'

describe('getEnvVar', () => {
    it('returns value for existing env var', () => {
        const testKey = 'KEY'
        const testVal = 'val'
        process.env[testKey] = testVal
        expect(_test.getEnvVar(testKey)).toBe(testVal)
    })

    it('throws error for missing env var', () => {
        const testKey = 'MISSING_KEY'
        expect(() => _test.getEnvVar(testKey)).toThrow(
            `missing env var ${testKey}`
        )
    })
})

describe('env flags', () => {
    beforeEach(() => vi.resetModules())

    it('sets dev env flags', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Dev
        const { dev, stage, prod } = await import('./env.js')
        expect(dev).toBe(true)
        expect(stage).toBe(false)
        expect(prod).toBe(false)
    })

    it('sets test env flags', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Test
        const { dev, stage, prod } = await import('./env.js')
        expect(dev).toBe(false)
        expect(stage).toBe(false)
        expect(prod).toBe(false)
    })

    it('sets stage env flags', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Stage
        const { dev, stage, prod } = await import('./env.js')
        expect(dev).toBe(false)
        expect(stage).toBe(true)
        expect(prod).toBe(true)
    })

    it('sets prod env flags', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { dev, stage, prod } = await import('./env.js')
        expect(dev).toBe(false)
        expect(stage).toBe(false)
        expect(prod).toBe(true)
    })
})
