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
    queueName: string,
    jobId: string | undefined,
    jobName: string | undefined,
    data: object
) => {
    return insertJob({
        id: -1,
        queueName,
        jobId: jobId ?? null,
        jobName: jobName ?? null,
        success: true,
        data,
    })
}

export const handleJobFailure = async (
    queueName: string,
    jobId: string | undefined,
    data: object | null,
    error: Error
) => {
    return insertJob({
        id: -1,
        queueName,
        jobId: jobId ?? null,
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
