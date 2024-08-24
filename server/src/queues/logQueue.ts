import { Queue, Worker } from 'bullmq'
import { insertAppRequest } from '../database/appRequestQueries.js'
import { insertPlaidApiRequest } from '../database/plaidApiRequestQueries.js'
import { insertPlaidLinkEvent } from '../database/plaidLinkEventQueries.js'
import { AppRequest } from '../models/appRequest.js'
import { HttpError } from '../models/httpError.js'
import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import { vars } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum LogJobType {
    LogAppRequest = 'AppRequest',
    LogPlaidLinkEvent = 'PlaidLinkEvent',
    LogPlaidApiRequest = 'PlaidApiRequest',
}

const logQueueName = `log-${vars.nodeEnv}`
let logQueue: Queue | null = null
let logWorker: Worker | null = null

export const initializeLogQueue = () => {
    logQueue = new Queue(logQueueName, { connection: getRedis() })
    logger.debug('initialized log queue')
}

const getLogQueue = () => {
    if (!logQueue) {
        throw new HttpError('log queue not initialized')
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
    // logger.debug(`${logQueueName} queue - adding job (${type})`)
    await getLogQueue().add(type, { log })
}

export const initializeLogWorker = () => {
    logWorker = new Worker(
        logQueueName,
        async (job) => {
            const type: LogJobType = job.name as LogJobType
            // logger.debug(
            //     `${logQueueName} queue - starting job (id ${job.id}, ${type})`
            // )
            switch (type) {
                case LogJobType.LogAppRequest: {
                    const req: AppRequest | undefined = job.data.log
                    if (!req) throw new HttpError(`missing ${type}`)

                    const newReq = await insertAppRequest(req)
                    if (!newReq) throw new HttpError(`failed to insert ${type}`)
                    break
                }
                case LogJobType.LogPlaidLinkEvent: {
                    const event: PlaidLinkEvent | undefined = job.data.log
                    if (!event) throw new HttpError(`missing ${type}`)

                    const newEvent = await insertPlaidLinkEvent(event)
                    if (!newEvent)
                        throw new HttpError(`failed to insert ${type}`)
                    break
                }
                case LogJobType.LogPlaidApiRequest: {
                    const req: PlaidApiRequest | undefined = job.data.log
                    if (!req) throw new HttpError(`missing ${type}`)

                    const newReq = await insertPlaidApiRequest(req)
                    if (!newReq) throw new HttpError(`failed to insert ${type}`)
                    break
                }
                default:
                    throw new HttpError(`unknown log job type: ${type}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    logWorker.on('completed', async (job) => {
        // logger.debug(`${logQueueName} queue - completed job (id ${job.id})`)
        await handleJobSuccess(logQueueName, job.id, job.name, job.data)
    })

    logWorker.on('failed', async (job, err) => {
        logger.error(
            { err },
            `${logQueueName} queue - failed job (id ${job?.id})`
        )
        await handleJobFailure(logQueueName, job?.id, job?.data, err)
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
