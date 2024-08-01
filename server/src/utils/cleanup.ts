import { exit, pid } from 'process'
import { stopPool } from '../database/index.js'
import { closeWorkers } from '../queues/index.js'
import { logger } from './logger.js'
import { closeRedis } from './redis.js'

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

let exiting = false
const runCleanupAndExit = async (event: string, err?: Error): Promise<void> => {
    logger.fatal(err, event)
    if (exiting) {
        logger.debug('already exiting')
        return
    }

    exiting = true
    try {
        await closeWorkers()
        closeRedis()
        await stopPool()
    } catch (e) {
        logger.fatal(e, 'error during cleanup')
    } finally {
        logger.info(`exiting - pid ${pid}`)
        exit(1)
    }
}
