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
        process.on(event, async (err?: Error) => {
            await runCleanupAndExit(event, err)
        })
    })
    logger.debug('configured cleanup')
}

const runCleanupAndExit = async (event: string, err?: Error): Promise<void> => {
    logger.fatal(err, event)
    try {
        await closeDb()
    } catch (e) {
        logger.fatal(e, 'error during cleanup')
    } finally {
        logger.info(`exit ${pid}`)
        process.exit(1)
    }
}
