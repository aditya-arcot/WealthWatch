import { Redis } from 'ioredis'
import { vars } from './env.js'
import { logger } from './logger.js'

let redis: Redis | undefined

export const createRedis = async (): Promise<void> => {
    logger.debug('creating redis client')
    redis = new Redis({
        host: vars.redisHost,
        maxRetriesPerRequest: null,
        retryStrategy: () => null,
    })
    try {
        await redis.ping()
        logger.debug('created redis client')
    } catch {
        throw Error('failed to create redis client')
    }
}

export const getRedis = (): Redis => {
    if (!redis) throw Error('redis client not initialized')
    return redis
}

export const stopRedis = (): void => {
    logger.debug('stopping redis client')
    if (!redis) {
        logger.warn('redis client not initialized')
        return
    }
    redis.disconnect()
    logger.debug('stopped redis client')
}
