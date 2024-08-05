import { Queue, Worker } from 'bullmq'
import { env } from 'process'
import { Item } from '../models/item.js'
import { plaidSyncItemData } from '../plaid/itemMethods.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

if (!env['NODE_ENV']) {
    throw Error('missing node env')
}
const itemSyncQueueName = `itemSync-${env['NODE_ENV']}`
let itemSyncQueue: Queue | null = null
let itemSyncWorker: Worker | null = null

export const initializeItemSyncQueue = () => {
    itemSyncQueue = new Queue(itemSyncQueueName, { connection: getRedis() })
    logger.debug('initialized item sync queue')
}

export const getItemSyncQueue = () => {
    if (!itemSyncQueue) {
        throw Error('item sync queue not initialized')
    }
    return itemSyncQueue
}

export const queueItemSync = async (item: Item) => {
    logger.debug(`${itemSyncQueueName} queue - adding job`)
    await getItemSyncQueue().add('ItemSync', { item })
}

export const initializeItemSyncWorker = () => {
    itemSyncWorker = new Worker(
        itemSyncQueueName,
        async (job) => {
            logger.debug(
                `${itemSyncQueueName} queue - starting job (id ${job.id})`
            )

            const item: Item | undefined = job.data.item
            if (!item) throw Error('missing item')

            await plaidSyncItemData(item)
        },
        { connection: getRedis(), ...workerOptions }
    )

    itemSyncWorker.on('completed', async (job) => {
        logger.debug(
            `${itemSyncQueueName} queue - completed job (id ${job.id})`
        )
        await handleJobSuccess(itemSyncQueueName, job.id, job.name, job.data)
    })

    itemSyncWorker.on('failed', async (job, err) => {
        logger.error(
            { err },
            `${itemSyncQueueName} queue - failed job (id ${job?.id})`
        )
        await handleJobFailure(itemSyncQueueName, job?.id, job?.data, err)
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
