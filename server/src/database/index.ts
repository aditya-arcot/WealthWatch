import pg, { QueryResult, QueryResultRow } from 'pg'
import { DatabaseError } from '../models/error.js'
import { vars } from '../utils/env.js'
import { logger } from '../utils/logger.js'

let clientPool: pg.Pool | undefined

export const createPool = async (): Promise<void> => {
    logger.debug('creating database pool')
    const config: pg.PoolConfig = {
        host: vars.dbHost,
        database: vars.dbName,
        user: vars.dbUser,
        password: vars.dbPassword,
        max: 20,
        allowExitOnIdle: true,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxUses: 7500,
    }
    clientPool = new pg.Pool(config)

    try {
        await runQuery('SELECT 1')
    } catch (error) {
        await clientPool.end()
        throw new DatabaseError('failed to create database pool')
    }
    logger.debug('created database pool')
}

export const getPool = (): pg.Pool => {
    if (!clientPool) throw new DatabaseError('pool not initialized')
    return clientPool
}

export const constructInsertQueryParamsPlaceholder = (
    rowCount: number,
    paramCount: number,
    counter: number = 1
): string => {
    if (rowCount < 1 || paramCount < 1)
        throw new DatabaseError('cannot construct parameters placeholder')

    const placeholders: string[] = []
    for (let i = 0; i < rowCount; i++) {
        const paramList: string[] = []
        for (let j = 0; j < paramCount; j++) {
            paramList.push(`$${counter++}`)
        }
        placeholders.push(`(${paramList.join(', ')})`)
    }
    return ` ${placeholders.join(', ')} `
}

export const runQuery = async <T extends QueryResultRow>(
    query: string,
    params: unknown[] = [],
    skipSuccessLog: boolean = false
): Promise<QueryResult<T>> => {
    if (!clientPool) {
        throw new DatabaseError('pool not initialized')
    }
    const start = Date.now()

    // replace whitespace with single space, lowercase, trim
    query = query.replace(/\s+/g, ' ').toLowerCase().trim()

    // replace parameterized values with placeholder
    let collapsedQuery = query
    if (query.startsWith('insert')) {
        // parameterized value rows
        const rows = query.match(/\(\s*(\$\d+(\s*,\s*\$\d+)*)\s*\)/g)
        if (rows) {
            const rowCount = rows.length
            const paramCount = rows[0]
                .replace('(', '')
                .replace(')', '')
                .split(',').length

            // replace parameterized values with placeholder
            const parameterizedValues =
                /values\s*\(\s*(\$\d+(\s*,\s*\$\d+)*)\s*\)(\s*,\s*\(\s*(\$\d+(\s*,\s*\$\d+)*)\s*\))*\s*/
            const valuesPlaceholder = `values (${rowCount} x ${paramCount}) `
            collapsedQuery = query.replace(
                parameterizedValues,
                valuesPlaceholder
            )
        }
    }

    try {
        const res = await clientPool.query(query, params)
        const queryLog = {
            duration: Date.now() - start,
            query: collapsedQuery,
            rowCount: res.rowCount,
        }
        if (!skipSuccessLog) logger.debug({ queryLog }, 'executed query')
        return res
    } catch (error) {
        const queryLog = {
            duration: Date.now() - start,
            query: collapsedQuery,
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
    await clientPool.end()
    logger.debug('stopped database pool')
}
