import { accessSync, constants } from 'fs'
import sqlite3 from 'sqlite3'
import { logger } from './logger.js'

let db: sqlite3.Database | null = null

export const openDb = async (): Promise<void> => {
    const dbUrl = process.env['SQLITE_DB_URL']
    if (!dbUrl) {
        throw Error('database url not provided')
    }

    try {
        accessSync(dbUrl, constants.F_OK)
    } catch (err) {
        throw Error('database file does not exist')
    }

    db = await new Promise<sqlite3.Database>((resolve, reject) => {
        const database = new sqlite3.Database(dbUrl, (err) => {
            if (err) {
                reject(Error('failed to open database connection'))
            } else {
                resolve(database)
            }
        })
    })
    logger.info('connected to database')
}

export const getDb = (): sqlite3.Database => {
    if (!db) {
        throw Error('database not initialized')
    }
    return db
}

export const closeDb = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
        getDb().close((err) => {
            if (err) {
                reject(Error('failed to close database connection'))
            } else {
                resolve()
            }
        })
    })
    logger.debug('disconnected from database')
}

export const runSelectQuery = <T>(query: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        getDb().all(query, (err, rows: T[]) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}
