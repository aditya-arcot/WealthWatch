import { pid } from 'process'
import { Database } from 'sqlite3'
import { logger } from './logger.js'

export const configureCleanup = (db: Database) => {
    const events = [
        'SIGINT',
        'SIGTERM',
        'SIGQUIT',
        'uncaughtException',
        'unhandledRejection',
    ]
    events.forEach((event) => {
        process.on(event, (err?: Error) => {
            runCleanupAndExit(db, event, err)
        })
    })
    logger.debug('configured cleanup')
}

const runCleanupAndExit = (db: Database, event: string, err?: Error) => {
    logger.fatal(err, event)
    try {
        db.close()
        logger.debug('disconnected from database')
    } catch (e) {
        logger.fatal(e, 'error during cleanup')
    } finally {
        logger.info(`exit ${pid}`)
        process.exit(1)
    }
}
