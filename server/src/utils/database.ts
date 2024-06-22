import pg from 'pg'
import { env } from 'process'
import { logger } from './logger.js'

let clientPool: pg.Pool | null = null

export const createPool = async (): Promise<void> => {
    logger.debug('creating database pool')
    if (!env['DB_USER']) throw Error('database username not set')
    const user = env['DB_USER']
    if (!env['DB_PASSWORD']) throw Error('database password not set')
    const password = env['DB_PASSWORD']
    if (!env['DB_NAME']) throw Error('database name not set')
    const database = env['DB_NAME']

    const config: pg.PoolConfig = {
        database,
        user,
        password,
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

export const closePool = async (): Promise<void> => {
    logger.debug('closing database pool')
    if (!clientPool) {
        throw Error('pool not initialized')
    }
    await clientPool.end()
    logger.debug('closed database pool')
}

export const runQuery = async (query: string, params: unknown[] = []) => {
    if (!clientPool) {
        throw Error('pool not initialized')
    }
    const start = Date.now()
    const res = await clientPool.query(query, params)
    const queryLog = {
        query,
        duration: Date.now() - start,
        rows: res.rowCount,
    }
    logger.info({ queryLog }, 'executed query')
    return res
}
