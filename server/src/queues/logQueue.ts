import { Queue, Worker } from 'bullmq'
import { env } from 'process'
import { insertAppRequest } from '../database/appRequestQueries.js'
import { insertPlaidApiRequest } from '../database/plaidApiRequestQueries.js'
import { insertPlaidLinkEvent } from '../database/plaidLinkEventQueries.js'
import { AppRequest } from '../models/appRequest.js'
import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum LogJobType {
    AppRequestLog = 'AppRequest',
    PlaidLinkEventLog = 'PlaidLinkEvent',
    PlaidApiRequestLog = 'PlaidApiRequest',
}

if (!env['NODE_ENV']) {
    throw Error('missing node env')
}
const logQueueName = `log-${env['NODE_ENV']}`
let logQueue: Queue | null = null
let logWorker: Worker | null = null

export const initializeLogQueue = () => {
    logQueue = new Queue(logQueueName, { connection: getRedis() })
    logger.debug('initialized log queue')
}

const getLogQueue = () => {
    if (!logQueue) {
        throw Error('log queue not initialized')
    }
    return logQueue
}

export const queueAppRequestLog = async (req: AppRequest) => {
    await queueLog(LogJobType.AppRequestLog, req)
}

export const queuePlaidLinkEventLog = async (event: PlaidLinkEvent) => {
    await queueLog(LogJobType.PlaidLinkEventLog, event)
}

export const queuePlaidApiRequestLog = async (req: PlaidApiRequest) => {
    await queueLog(LogJobType.PlaidApiRequestLog, req)
}

const queueLog = async (type: LogJobType, log: object) => {
    logger.debug(`${logQueueName} queue - adding job (${type})`)
    await getLogQueue().add(type, { log })
}

export const initializeLogWorker = () => {
    logWorker = new Worker(
        logQueueName,
        async (job) => {
            const type: LogJobType = job.name as LogJobType
            logger.debug(
                `${logQueueName} queue - starting job (id ${job.id}, ${type})`
            )
            switch (type) {
                case LogJobType.AppRequestLog: {
                    const req: AppRequest | undefined = job.data.log
                    if (!req) throw Error(`missing ${type}`)

                    const newReq = await insertAppRequest(req)
                    if (!newReq) throw Error(`failed to insert ${type}`)
                    break
                }
                case LogJobType.PlaidLinkEventLog: {
                    const event: PlaidLinkEvent | undefined = job.data.log
                    if (!event) throw Error(`missing ${type}`)

                    const newEvent = await insertPlaidLinkEvent(event)
                    if (!newEvent) throw Error(`failed to insert ${type}`)
                    break
                }
                case LogJobType.PlaidApiRequestLog: {
                    const req: PlaidApiRequest | undefined = job.data.log
                    if (!req) throw Error(`missing ${type}`)

                    const newReq = await insertPlaidApiRequest(req)
                    if (!newReq) throw Error(`failed to insert ${type}`)
                    break
                }
                default:
                    throw Error(`unknown log job type: ${type}`)
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    logWorker.on('completed', async (job) => {
        logger.debug(`${logQueueName} queue - completed job (id ${job.id})`)
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
