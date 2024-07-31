import { insertJob } from '../database/jobQueries.js'
import { logger } from '../utils/logger.js'
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

export const workerOptions = {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    concurrency: 50,
}

export const handleJobSuccess = async (
    jobId: string | undefined,
    type: string,
    data: object
) => {
    return insertJob({
        id: -1,
        jobId: jobId ?? null,
        type,
        success: true,
        data,
    })
}

export const handleJobFailure = async (
    jobId: string | undefined,
    type: string,
    data: object | null,
    error: Error
) => {
    return insertJob({
        id: -1,
        jobId: jobId ?? null,
        type,
        success: false,
        data,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack ?? null,
    })
}

export const closeWorkers = async () => {
    logger.debug('closing workers')
    await closeLogWorker()
    await closeItemSyncWorker()
}
