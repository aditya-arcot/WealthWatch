import { pid } from 'process'
import { stopPool } from '../database/index.js'
import { CLEANUP_EVENTS } from '../models/constants.js'
import { closeWorkers } from '../queues/index.js'
import { logger } from './logger.js'
import { stopRedis } from './redis.js'

export const configureCleanup = (): void => {
    CLEANUP_EVENTS.forEach((event) => {
        process.on(event, (err?: Error) => {
            runCleanupAndExit(event, err).catch((err) => {
                logger.fatal(err, 'error during cleanup')
            })
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
