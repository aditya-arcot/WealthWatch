import { Queue, Worker } from 'bullmq'
import { Item } from '../models/item.js'
import { plaidSyncItemData } from '../plaid/itemMethods.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

let itemSyncQueue: Queue | null = null
let itemSyncWorker: Worker | null = null

export const initializeItemSyncQueue = () => {
    itemSyncQueue = new Queue('itemSync', { connection: getRedis() })
    logger.debug('initialized item sync queue')
}

export const getItemSyncQueue = () => {
    if (!itemSyncQueue) {
        throw Error('item sync queue not initialized')
    }
    return itemSyncQueue
}

export const queueItemSync = async (item: Item) => {
    logger.debug('adding item sync job to queue')
    await getItemSyncQueue().add('sync', { item })
}

export const initializeItemSyncWorker = () => {
    itemSyncWorker = new Worker(
        'itemSync',
        async (job) => {
            logger.debug(`starting item sync job (id ${job.id})`)

            const item: Item | undefined = job.data.item
            if (!item) throw Error('missing item')

            await plaidSyncItemData(item)
        },
        { connection: getRedis(), ...workerOptions }
    )

    itemSyncWorker.on('completed', async (job) => {
        logger.debug(`job (id ${job.id}) completed`)
        await handleJobSuccess(job.id, 'itemSync', job.data)
    })

    itemSyncWorker.on('failed', async (job, err) => {
        logger.error({ err }, `job (id ${job?.id}) failed`)
        await handleJobFailure(job?.id, 'itemSync', job?.data, err)
    })

    logger.debug('initialized item sync worker')
}

export const closeItemSyncWorker = async () => {
    if (!itemSyncWorker) {
        logger.warn('item sync worker not initialized')
        return
    }
    await itemSyncWorker.close()
    logger.debug('closed item sync worker')
}
