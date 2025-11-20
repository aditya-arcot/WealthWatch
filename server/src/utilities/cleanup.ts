import { stopPool } from '@database'
import { CLEANUP_EVENTS } from '@models'
import { closeWorkers } from '@queues'
import { logger, stopRedis } from '@utilities'
import { pid } from 'process'

export const configureCleanup = (): void => {
    CLEANUP_EVENTS.forEach((event) => {
        process.on(event, (err?: Error) => {
            void runCleanupAndExit(event, err)
        })
    })
    logger.debug('configured cleanup')
}

let exiting = false
const runCleanupAndExit = async (event: string, err?: Error): Promise<void> => {
    logger.fatal(err, event)
    if (exiting) {
        logger.warn('already exiting')
        return
    }
    exiting = true
    try {
        await closeWorkers()
        stopRedis()
        await stopPool()
    } catch (error) {
        logger.fatal(error, 'error during cleanup')
    } finally {
        logger.info(`exiting - pid ${pid}`)
        process.exit(1)
    }
}

export const _cleanupTest = { runCleanupAndExit }
