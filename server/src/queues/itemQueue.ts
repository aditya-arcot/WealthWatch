import { Queue, Worker } from 'bullmq'
import { env } from 'process'
import { refreshItemBalances } from '../controllers/itemController.js'
import { Item } from '../models/item.js'
import { plaidSyncItemData } from '../plaid/itemMethods.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum ItemJobType {
    ItemSync = 'ItemSync',
    ItemBalancesRefresh = 'ItemBalancesRefresh',
}

if (env['NODE_ENV'] === undefined) {
    throw Error('missing node env')
}
const itemQueueName = `item-${env['NODE_ENV']}`
let itemQueue: Queue | null = null
let itemWorker: Worker | null = null

export const initializeItemQueue = () => {
    itemQueue = new Queue(itemQueueName, { connection: getRedis() })
    logger.debug('initialized item queue')
}

export const getItemQueue = () => {
    if (!itemQueue) {
        throw Error('item queue not initialized')
    }
    return itemQueue
}

export const queueItemSync = async (item: Item) => {
    await queueItem(ItemJobType.ItemSync, item)
}

export const queueItemBalancesRefresh = async (item: Item) => {
    await queueItem(ItemJobType.ItemBalancesRefresh, item)
}

const queueItem = async (type: ItemJobType, item: Item) => {
    logger.debug(`${itemQueueName} queue - adding job (${type})`)
    await getItemQueue().add(type, { item })
}

export const initializeItemWorker = () => {
    itemWorker = new Worker(
        itemQueueName,
        async (job) => {
            const type: ItemJobType = job.name as ItemJobType
            logger.debug(
                `${itemQueueName} queue - starting job (id ${job.id}, ${type})`
            )
            const item: Item | undefined = job.data.item
            if (!item) throw Error('missing item')

            switch (type) {
                case ItemJobType.ItemSync: {
                    await plaidSyncItemData(item)
                    break
                }
                case ItemJobType.ItemBalancesRefresh: {
                    await refreshItemBalances(item)
                    break
                }
                default:
                    throw Error(`unknown job type: ${type}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    itemWorker.on('completed', async (job) => {
        logger.debug(`${itemQueueName} queue - completed job (id ${job.id})`)
        await handleJobSuccess(itemQueueName, job.id, job.name, job.data)
    })

    itemWorker.on('failed', async (job, err) => {
        logger.error(
            { err },
            `${itemQueueName} queue - failed job (id ${job?.id})`
        )
        await handleJobFailure(itemQueueName, job?.id, job?.data, err)
    })

    logger.debug('initialized item worker')
}

export const closeItemWorker = async () => {
    if (!itemWorker) {
        logger.warn('item worker not initialized')
        return
    }
    await itemWorker.close()
    logger.debug('closed item worker')
}
