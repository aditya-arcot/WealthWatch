import { accessSync, constants } from 'fs'
import { exit } from 'process'
import sqlite3 from 'sqlite3'
import { logger } from './logger.js'

export const connectToDb = () => {
    const dbUrl = process.env['SQLITE_DB_URL']
    if (!dbUrl) {
        logger.fatal('database url not provided')
        exit(1)
    }

    try {
        accessSync(dbUrl, constants.F_OK)
    } catch (err) {
        throw Error('database file does not exist')
    }

    return new sqlite3.Database(dbUrl, (err) => {
        if (err) {
            throw Error('failed to connect to database')
        }
        logger.info('connected to database')
    })
}
