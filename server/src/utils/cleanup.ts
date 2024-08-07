import { exit, pid } from 'process'
import { closePool } from './database.js'
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
        await closePool()
    } catch (e) {
        logger.fatal(e, 'error during cleanup')
    } finally {
        logger.info(`exiting - pid ${pid}`)
        exit(1)
    }
}
