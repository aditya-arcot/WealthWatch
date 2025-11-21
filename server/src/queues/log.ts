import {
    insertAppRequest,
    insertPlaidApiRequest,
    insertPlaidLinkEvent,
} from '@database'
import { AppRequest, PlaidApiRequest } from '@models'
import { handleJobFailure, handleJobSuccess, workerOptions } from '@queues'
import { getRedis, logger, vars } from '@utilities'
import { PlaidLinkEvent } from '@wealthwatch-shared'
import { Queue, Worker } from 'bullmq'

enum LogJobType {
    LogAppRequest = 'AppRequest',
    LogPlaidLinkEvent = 'PlaidLinkEvent',
    LogPlaidApiRequest = 'PlaidApiRequest',
}

let logQueue: Queue | null = null
let logWorker: Worker | null = null

const getQueueName = () => `log-${vars.nodeEnv}`

export const initializeLogQueue = () => {
    logQueue = new Queue(getQueueName(), { connection: getRedis() })
    logger.debug('initialized log queue')
}

const getQueue = () => {
    if (!logQueue) {
        throw Error('log queue not initialized')
    }
    return logQueue
}

export const queueLogAppRequest = async (req: AppRequest) => {
    await queueLog(LogJobType.LogAppRequest, req)
}

export const queueLogPlaidLinkEvent = async (event: PlaidLinkEvent) => {
    await queueLog(LogJobType.LogPlaidLinkEvent, event)
}

export const queueLogPlaidApiRequest = async (req: PlaidApiRequest) => {
    await queueLog(LogJobType.LogPlaidApiRequest, req)
}

const queueLog = async (type: LogJobType, log: object) => {
    // logger.debug(`${getQueueName()} queue - adding job (${type})`)
    await getQueue().add(type, { log })
}

export const initializeLogWorker = () => {
    logWorker = new Worker(
        getQueueName(),
        async (job) => {
            const type: LogJobType = job.name as LogJobType
            // logger.debug(
            //     `${getQueueName()} queue - starting job (id ${job.id}, ${type})`
            // )
            switch (type) {
                case LogJobType.LogAppRequest: {
                    const req: AppRequest | undefined = job.data.log
                    if (!req) throw Error(`missing ${type}`)
                    await insertAppRequest(req)
                    break
                }
                case LogJobType.LogPlaidLinkEvent: {
                    const event: PlaidLinkEvent | undefined = job.data.log
                    if (!event) throw Error(`missing ${type}`)
                    await insertPlaidLinkEvent(event)
                    break
                }
                case LogJobType.LogPlaidApiRequest: {
                    const req: PlaidApiRequest | undefined = job.data.log
                    if (!req) throw Error(`missing ${type}`)
                    await insertPlaidApiRequest(req)
                    break
                }
                default:
                    throw Error(`unknown log job type: ${type}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    logWorker.on('completed', (job) => {
        // logger.debug(`${getQueueName()} queue - completed job (id ${job.id})`)
        handleJobSuccess(getQueueName(), job.id, job.name, job.data).catch(
            (err) => {
                logger.error(err, `error handling job success`)
            }
        )
    })

    logWorker.on('failed', (job, err) => {
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

    logger.debug('initialized log worker')
}

export const closeLogWorker = async () => {
    if (!logWorker) {
        logger.warn('log worker not initialized')
        return
    }
    await logWorker.close()
    logger.debug('closed log worker')
}
