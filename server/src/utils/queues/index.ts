import { logger } from '../logger.js'
import {
    closeLogWorker,
    initializeLogQueue,
    initializeLogWorker,
} from './logQueue.js'

export const initializeQueues = () => {
    logger.debug('initializing queues')
    initializeLogQueue()
}

export const initializeWorkers = () => {
    logger.debug('initializing workers')
    initializeLogWorker()
}

export const closeWorkers = async () => {
    logger.debug('closing workers')
    await closeLogWorker()
}

export const workerOptions = {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 50,
}
