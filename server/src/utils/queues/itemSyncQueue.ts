import { Queue, Worker } from 'bullmq'
import { Item } from '../../models/item.js'
import { syncItemData } from '../../services/plaidService.js'
import { logger } from '../logger.js'
import { getRedis } from '../redis.js'
import { workerOptions } from './index.js'

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

export const addItemSyncToQueue = async (item: Item) => {
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

            await syncItemData(item)
        },
        { connection: getRedis(), ...workerOptions }
    )
}

export const closeItemSyncWorker = async () => {
    if (!itemSyncWorker) {
        throw Error('item sync worker not initialized')
    }
    await itemSyncWorker.close()
    logger.debug('closed item sync worker')
}
