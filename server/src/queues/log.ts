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

interface LogJobData {
    log?: object
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
    logWorker = new Worker<LogJobData>(
        getQueueName(),
        async (job) => {
            const type: LogJobType = job.name as LogJobType
            // logger.debug(
            //     `${getQueueName()} queue - starting job (id ${job.id}, ${type})`
            // )
            switch (type) {
                case LogJobType.LogAppRequest: {
                    const req = job.data.log as AppRequest | undefined
                    if (!req) throw Error(`missing ${type}`)
                    await insertAppRequest(req)
                    break
                }
                case LogJobType.LogPlaidLinkEvent: {
                    const event = job.data.log as PlaidLinkEvent | undefined
                    if (!event) throw Error(`missing ${type}`)
                    await insertPlaidLinkEvent(event)
                    break
                }
                case LogJobType.LogPlaidApiRequest: {
                    const req = job.data.log as PlaidApiRequest | undefined
                    if (!req) throw Error(`missing ${type}`)
                    await insertPlaidApiRequest(req)
                    break
                }
                default:
                    throw Error(`unknown log job type: ${String(type)}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    logWorker.on('completed', (job) => {
        // logger.debug(`${getQueueName()} queue - completed job (id ${job.id})`)
        handleJobSuccess(
            getQueueName(),
            job.id,
            job.name,
            job.data as LogJobData
        ).catch((err: unknown) => {
            logger.error(err, `error handling job success`)
        })
    })

    logWorker.on('failed', (job, err) => {
        logger.error(
            { err },
            `${getQueueName()} queue - failed job (id ${String(job?.id)})`
        )
        handleJobFailure(
            getQueueName(),
            job?.id,
            job?.name,
            job?.data as LogJobData,
            err
        ).catch((err: unknown) => {
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
