import { logger } from '../logger.js'
import {
    closeItemSyncWorker,
    initializeItemSyncQueue,
    initializeItemSyncWorker,
} from './itemSyncQueue.js'
import {
    closeLogWorker,
    initializeLogQueue,
    initializeLogWorker,
} from './logQueue.js'

export const initializeQueues = () => {
    logger.debug('initializing queues')
    initializeLogQueue()
    initializeItemSyncQueue()
}

export const initializeWorkers = () => {
    logger.debug('initializing workers')
    initializeLogWorker()
    initializeItemSyncWorker()
}

export const closeWorkers = async () => {
    logger.debug('closing workers')
    await closeLogWorker()
    await closeItemSyncWorker()
}

export const workerOptions = {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 50,
}
