import {
    syncItemAccounts,
    syncItemBalances,
    syncItemInvestments,
    syncItemLiabilities,
    syncItemTransactions,
} from '@controllers'
import { handleJobFailure, handleJobSuccess, workerOptions } from '@queues'
import { getRedis, logger, vars } from '@utilities'
import { Item } from '@wealthwatch-shared'
import { Queue, Worker } from 'bullmq'

enum ItemJobType {
    SyncTransactions = 'SyncTransactions',
    SyncInvestments = 'SyncInvestments',
    SyncLiabilities = 'SyncLiabilities',
    SyncBalances = 'SyncBalances',
}

let itemQueue: Queue | null = null
let itemWorker: Worker | null = null

const getQueueName = () => `item-${vars.nodeEnv}`

export const initializeItemQueue = () => {
    itemQueue = new Queue(getQueueName(), { connection: getRedis() })
    logger.debug('initialized item queue')
}

const getQueue = () => {
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
    logger.debug(`${getQueueName()} queue - adding job (${type})`)
    await getQueue().add(type, { item, syncAccounts })
}

export const initializeItemWorker = () => {
    itemWorker = new Worker(
        getQueueName(),
        async (job) => {
            const type: ItemJobType = job.name as ItemJobType
            logger.debug(
                `${getQueueName()} queue - starting job (id ${job.id}, ${type})`
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
        logger.debug(`${getQueueName()} queue - completed job (id ${job.id})`)
        handleJobSuccess(getQueueName(), job.id, job.name, job.data).catch(
            (err) => {
                logger.error(err, `error handling job success`)
            }
        )
    })

    itemWorker.on('failed', (job, err) => {
        logger.error(
            { err },
            `${getQueueName()} queue - failed job (id ${job?.id})`
        )
        handleJobFailure(
            getQueueName(),
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
