import { Redis } from 'ioredis'
import { HttpError } from '../models/error.js'
import { vars } from './env.js'
import { logger } from './logger.js'

let redis: Redis | null = null

export const createRedis = (): void => {
    logger.debug('creating redis client')
    redis = new Redis({
        host: vars.redisHost,
        maxRetriesPerRequest: null,
    })
    logger.debug('created redis client')
}

export const getRedis = (): Redis => {
    if (!redis) {
        throw new HttpError('redis client not initialized')
    }
    return redis
}

export const closeRedis = (): void => {
    logger.debug('closing redis client')
    getRedis().disconnect()
    logger.debug('closed redis client')
}
