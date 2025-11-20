import { EnvNameEnum } from '@wealthwatch-shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mkdirSync = vi.fn()
const existsSync = vi.fn(() => true)

vi.mock('fs', () => ({
    default: {
        existsSync,
        mkdirSync,
    },
}))

beforeEach(() => vi.resetModules())

describe('logger', async () => {
    it('creates log directory and sets up logger with three targets for dev', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Dev
        existsSync.mockReturnValue(false)

        const { _test } = await import('@utilities/logger.js')
        expect(mkdirSync).toHaveBeenCalled()
        expect(_test.targets.length).toBe(3)
    })

    it('sets up logger with two targets for non-dev', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Test
        const { _test } = await import('@utilities/logger.js')
        expect(_test.targets.length).toBe(2)
    })
})
