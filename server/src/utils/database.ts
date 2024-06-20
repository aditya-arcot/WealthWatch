import { accessSync, constants } from 'fs'
import sqlite3 from 'sqlite3'
import { logger } from './logger.js'

let db: sqlite3.Database | null = null

export const openDb = (): void => {
    const dbUrl = process.env['SQLITE_DB_URL']
    if (!dbUrl) {
        throw Error('database url not provided')
    }

    try {
        accessSync(dbUrl, constants.F_OK)
    } catch (err) {
        throw Error('database file does not exist')
    }

    db = new sqlite3.Database(dbUrl, (err) => {
        if (err) {
            throw Error('failed to connect to database')
        }
    })
    logger.info('connected to database')
}

export const getDb = (): sqlite3.Database => {
    if (!db) {
        throw Error('database not initialized')
    }
    return db
}

export const closeDb = (): void => {
    getDb().close()
    logger.debug('disconnected from database')
}
