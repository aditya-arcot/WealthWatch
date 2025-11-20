import * as logger from '@utilities/logger.js'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

let redisConstructorMock: Mock

const setupMockRedis = (pingMock = vi.fn().mockResolvedValue('PONG')) => {
    redisConstructorMock = vi.fn().mockImplementation(
        // @ts-expect-error Mock Redis class
        class MockRedis {
            ping = pingMock
            disconnect = vi.fn()
        }
    )
    vi.doMock('ioredis', () => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Redis: redisConstructorMock,
    }))
}

vi.mock('./logger', () => ({
    logger: {
        debug: vi.fn(),
        warn: vi.fn(),
    },
}))

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    setupMockRedis()
})

describe('createRedis', () => {
    const mockRedisHost = 'mock-redis-host'

    it('creates redis client with correct config', async () => {
        process.env['REDIS_HOST'] = mockRedisHost
        const { createRedis, getRedis } = await import('@utilities/redis.js')
        await createRedis()
        const redis = getRedis()

        const args = redisConstructorMock.mock.calls[0]?.[0]
        expect(args).toBeDefined()
        expect(args.host).toBe(mockRedisHost)
        expect(args.maxRetriesPerRequest).toBeNull()
        expect(args.retryStrategy()).toBeNull()

        expect(redis.ping).toHaveBeenCalled()
        expect(logger.logger.debug).toHaveBeenCalledTimes(2)
        expect(logger.logger.debug).toHaveBeenNthCalledWith(
            1,
            'creating redis client'
        )
        expect(logger.logger.debug).toHaveBeenNthCalledWith(
            2,
            'created redis client'
        )
    })

    it('throws error if redis client creation fails', async () => {
        setupMockRedis(
            vi.fn().mockRejectedValue(new Error('connection failed'))
        )
        const { createRedis } = await import('@utilities/redis.js')
        await expect(createRedis()).rejects.toThrow(
            'failed to create redis client'
        )
    })
})

describe('getRedis', () => {
    it('returns redis client if initialized', async () => {
        const { createRedis, getRedis } = await import('@utilities/redis.js')
        await createRedis()
        const redis = getRedis()

        expect(redis.ping).toBeInstanceOf(Function)
        expect(redis.disconnect).toBeInstanceOf(Function)
    })

    it('throws error if redis client not initialized', async () => {
        const { getRedis } = await import('@utilities/redis.js')
        expect(() => getRedis()).toThrow('redis client not initialized')
    })
})

describe('stopRedis', () => {
    it('stops redis client if initialized', async () => {
        const { createRedis, getRedis, stopRedis } = await import(
            '@utilities/redis.js'
        )
        await createRedis()
        const redis = getRedis()
        stopRedis()

        expect(redis.disconnect).toHaveBeenCalled()
        expect(logger.logger.debug).toHaveBeenCalledTimes(4)
        expect(logger.logger.debug).toHaveBeenNthCalledWith(
            3,
            'stopping redis client'
        )
        expect(logger.logger.debug).toHaveBeenNthCalledWith(
            4,
            'stopped redis client'
        )
    })

    it('logs warning if redis client not initialized', async () => {
        const { stopRedis } = await import('@utilities/redis.js')
        stopRedis()

        expect(logger.logger.debug).toHaveBeenCalledExactlyOnceWith(
            'stopping redis client'
        )
        expect(logger.logger.warn).toHaveBeenCalledWith(
            'redis client not initialized'
        )
    })
})
