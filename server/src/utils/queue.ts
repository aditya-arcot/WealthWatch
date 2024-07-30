import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { LogJobType } from '../models/job.js'
import {
    createPlaidApiRequest,
    createPlaidLinkEvent,
    PlaidApiRequest,
    PlaidLinkEvent,
} from '../models/plaid.js'
import { AppRequest, createAppRequest } from '../models/request.js'
import { logger } from './logger.js'

const redis = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
})
const logQueue = new Queue('logs', { connection: redis })

export const addAppRequestToQueue = async (req: AppRequest) => {
    logger.debug('adding app request job to queue')
    await logQueue.add('log', { type: LogJobType.AppRequestLog, log: req })
}

export const addPlaidLinkEventLogToQueue = async (event: PlaidLinkEvent) => {
    logger.debug('adding plaid link event log job to queue')
    await logQueue.add('log', {
        type: LogJobType.PlaidLinkEventLog,
        log: event,
    })
}

export const addPlaidApiRequestLogToQueue = async (req: PlaidApiRequest) => {
    logger.debug('adding plaid api request log job to queue')
    await logQueue.add('log', { type: LogJobType.PlaidApiRequestLog, log: req })
}

const logWorker = new Worker(
    'logs',
    async (job) => {
        const type: LogJobType = job.data.type
        logger.debug(`starting log job (id ${job.id}) - type ${type}`)
        switch (type) {
            case LogJobType.AppRequestLog: {
                const req: AppRequest | undefined = job.data.log
                if (!req) throw Error('missing app request')
                await createAppRequestLog(req)
                break
            }
            case LogJobType.PlaidLinkEventLog: {
                const event: PlaidLinkEvent | undefined = job.data.log
                if (!event) throw Error('missing plaid link event')
                await createLinkEventLog(event)
                break
            }
            case LogJobType.PlaidApiRequestLog: {
                const req: PlaidApiRequest | undefined = job.data.log
                if (!req) throw Error('missing plaid api request')
                await createPlaidApiRequestLog(req)
                break
            }
            default:
                logger.error('unknown log job type: ' + type)
                break
        }
    },
    { connection: redis }
)

logWorker.on('failed', (job, err) => {
    logger.error({ error: err }, `job (id ${job?.id}) failed`)
})

logWorker.on('completed', (job) => {
    logger.debug(`job (id ${job.id}) completed`)
})

const createAppRequestLog = async (req: AppRequest) => {
    const newReq = await createAppRequest(req)
    if (!newReq) throw Error('failed to create app request log')
}

const createPlaidApiRequestLog = async (req: PlaidApiRequest) => {
    const newReq = await createPlaidApiRequest(req)
    if (!newReq) throw Error('failed to create plaid api request log')
}

const createLinkEventLog = async (event: PlaidLinkEvent) => {
    const newEvent = await createPlaidLinkEvent(event)
    if (!newEvent) throw Error('failed to create plaid link event log')
}
