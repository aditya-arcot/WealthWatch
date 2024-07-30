import { Redis } from 'ioredis'
import { env } from 'process'
import { logger } from './logger.js'

let redis: Redis | null = null

export const createRedis = (): void => {
    logger.debug('creating redis client')
    if (!env['REDIS_HOST'] || !env['REDIS_PORT']) {
        throw Error('missing one or more redis secrets')
    }
    redis = new Redis({
        host: env['REDIS_HOST'],
        port: Number(env['REDIS_PORT']),
        maxRetriesPerRequest: null,
    })
    logger.debug('created redis client')
}

export const getRedis = (): Redis => {
    if (!redis) {
        throw Error('redis not initialized')
    }
    return redis
}

export const closeRedis = (): void => {
    logger.debug('closing redis client')
    getRedis().disconnect()
    logger.debug('closed redis client')
}
