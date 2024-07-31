import pg from 'pg'
import { env } from 'process'
import { logger } from '../utils/logger.js'

let clientPool: pg.Pool | null = null

export const createPool = async (): Promise<void> => {
    logger.debug('creating database pool')
    if (
        !env['DB_HOST'] ||
        !env['DB_NAME'] ||
        !env['DB_USER'] ||
        !env['DB_PASSWORD']
    ) {
        throw Error('missing one or more database secrets')
    }

    const config: pg.PoolConfig = {
        host: env['DB_HOST'],
        database: env['DB_NAME'],
        user: env['DB_USER'],
        password: env['DB_PASSWORD'],
        max: 20,
        allowExitOnIdle: true,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxUses: 7500,
    }
    clientPool = new pg.Pool(config)

    try {
        await runQuery('SELECT 1')
    } catch (e) {
        await clientPool.end()
        throw Error('failed to create database pool')
    }
    logger.debug('created database pool')
}

export const getPool = (): pg.Pool => {
    if (!clientPool) {
        throw Error('pool not initialized')
    }
    return clientPool
}

export const runQuery = async (query: string, params: unknown[] = []) => {
    if (!clientPool) {
        throw Error('pool not initialized')
    }
    const start = Date.now()
    query = query.replace(/\s+/g, ' ').trim()
    try {
        const res = await clientPool.query(query, params)
        const queryLog = {
            duration: Date.now() - start,
            query,
            rowCount: res.rowCount,
        }
        logger.debug({ queryLog }, 'executed query')
        return res
    } catch (error) {
        const queryLog = {
            duration: Date.now() - start,
            query,
            error,
        }
        logger.error({ queryLog }, 'failed to execute query')
        throw error
    }
}

export const stopPool = async (): Promise<void> => {
    logger.debug('stopping database pool')
    if (!clientPool) {
        logger.warn('database pool not initialized')
        return
    }
    clientPool.end()
    logger.debug('stopped database pool')
}
