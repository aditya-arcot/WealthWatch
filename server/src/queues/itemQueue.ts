import { Item } from '@wealthwatch-shared'
import { Queue, Worker } from 'bullmq'
import {
    syncItemAccounts,
    syncItemBalances,
    syncItemInvestments,
    syncItemLiabilities,
    syncItemTransactions,
} from '../controllers/itemController.js'
import { vars } from '../utilities/env.js'
import { logger } from '../utilities/logger.js'
import { getRedis } from '../utilities/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum ItemJobType {
    SyncTransactions = 'SyncTransactions',
    SyncInvestments = 'SyncInvestments',
    SyncLiabilities = 'SyncLiabilities',
    SyncBalances = 'SyncBalances',
}

const itemQueueName = `item-${vars.nodeEnv}`
let itemQueue: Queue | null = null
let itemWorker: Worker | null = null

export const initializeItemQueue = () => {
    itemQueue = new Queue(itemQueueName, { connection: getRedis() })
    logger.debug('initialized item queue')
}

const getItemQueue = () => {
    if (!itemQueue) {
        throw Error('item queue not initialized')
    }
    return itemQueue
}

export const queueSyncItemTransactions = async (
    item: Item,
    syncAccounts = false
) => {
    await queueItem(ItemJobType.SyncTransactions, item, syncAccounts)
}

export const queueSyncItemInvestments = async (
    item: Item,
    syncAccounts = false
) => {
    await queueItem(ItemJobType.SyncInvestments, item, syncAccounts)
}

export const queueSyncItemLiabilities = async (
    item: Item,
    syncAccounts = false
) => {
    await queueItem(ItemJobType.SyncLiabilities, item, syncAccounts)
}

export const queueSyncItemBalances = async (item: Item) => {
    // separate account sync unnecessary
    await queueItem(ItemJobType.SyncBalances, item, false)
}

const queueItem = async (
    type: ItemJobType,
    item: Item,
    syncAccounts: boolean
) => {
    logger.debug(`${itemQueueName} queue - adding job (${type})`)
    await getItemQueue().add(type, { item, syncAccounts })
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

            const syncAccounts: boolean = job.data.syncAccounts
            if (syncAccounts) await syncItemAccounts(item)

            switch (type) {
                case ItemJobType.SyncTransactions: {
                    await syncItemTransactions(item)
                    break
                }
                case ItemJobType.SyncInvestments: {
                    await syncItemInvestments(item)
                    break
                }
                case ItemJobType.SyncLiabilities: {
                    await syncItemLiabilities(item)
                    break
                }
                case ItemJobType.SyncBalances: {
                    await syncItemBalances(item)
                    break
                }
                default:
                    throw Error(`unknown job type: ${type}`)
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
