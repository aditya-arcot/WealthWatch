import { pid } from 'process'
import { closeDb } from './database.js'
import { logger } from './logger.js'

export const configureCleanup = (): void => {
    const events = [
        'SIGINT',
        'SIGTERM',
        'SIGQUIT',
        'uncaughtException',
        'unhandledRejection',
    ]
    events.forEach((event) => {
        process.on(event, (err?: Error) => {
            runCleanupAndExit(event, err)
        })
    })
    logger.debug('configured cleanup')
}

const runCleanupAndExit = (event: string, err?: Error): void => {
    logger.fatal(err, event)
    try {
        closeDb()
    } catch (e) {
        logger.fatal(e, 'error during cleanup')
    } finally {
        logger.info(`exit ${pid}`)
        process.exit(1)
    }
}
