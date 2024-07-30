import { logger } from '../logger.js'
import { initializeLogQueue, initializeLogWorker } from './logQueue.js'

export const initializeQueues = () => {
    logger.debug('initializing queues')
    initializeLogQueue()
}

export const initializeWorkers = () => {
    logger.debug('initializing workers')
    initializeLogWorker()
}
