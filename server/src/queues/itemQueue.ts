import { Queue, Worker } from 'bullmq'
import {
    syncItemBalances,
    syncItemInvestments,
    syncItemTransactions,
} from '../controllers/itemController.js'
import { HttpError } from '../models/error.js'
import { Item } from '../models/item.js'
import { vars } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum ItemJobType {
    SyncTransactions = 'SyncTransactions',
    SyncInvestments = 'SyncInvestments',
    SyncBalances = 'SyncBalances',
}

const itemQueueName = `item-${vars.nodeEnv}`
let itemQueue: Queue | null = null
let itemWorker: Worker | null = null

export const initializeItemQueue = () => {
    itemQueue = new Queue(itemQueueName, { connection: getRedis() })
    logger.debug('initialized item queue')
}

export const getItemQueue = () => {
    if (!itemQueue) {
        throw new HttpError('item queue not initialized')
    }
    return itemQueue
}

export const queueSyncItemTransactions = async (item: Item) => {
    await queueItem(ItemJobType.SyncTransactions, item)
}

export const queueSyncItemInvestments = async (item: Item) => {
    await queueItem(ItemJobType.SyncInvestments, item)
}

export const queueSyncItemBalances = async (item: Item) => {
    await queueItem(ItemJobType.SyncBalances, item)
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
            if (!item) throw new HttpError('missing item')

            switch (type) {
                case ItemJobType.SyncTransactions: {
                    await syncItemTransactions(item)
                    break
                }
                case ItemJobType.SyncInvestments: {
                    await syncItemInvestments(item)
                    break
                }
                case ItemJobType.SyncBalances: {
                    await syncItemBalances(item)
                    break
                }
                default:
                    throw new HttpError(`unknown job type: ${type}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    itemWorker.on('completed', (job) => {
        logger.debug(`${itemQueueName} queue - completed job (id ${job.id})`)
        handleJobSuccess(itemQueueName, job.id, job.name, job.data).catch(
            (err) => {
                logger.error(err, `error handling job success`)
            }
        )
    })

    itemWorker.on('failed', (job, err) => {
        logger.error(
            { err },
            `${itemQueueName} queue - failed job (id ${job?.id})`
        )
        handleJobFailure(
            itemQueueName,
            job?.id,
            job?.name,
            job?.data,
            err
        ).catch((err) => {
            logger.error(err, `error handling job failure`)
        })
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
