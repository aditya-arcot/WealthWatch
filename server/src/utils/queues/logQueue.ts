import { Queue, Worker } from 'bullmq'
import { LogJobType } from '../../models/job.js'
import {
    createPlaidApiRequest,
    createPlaidLinkEvent,
    createWebhook,
    PlaidApiRequest,
    PlaidLinkEvent,
    Webhook,
} from '../../models/plaid.js'
import { AppRequest, createAppRequest } from '../../models/request.js'
import { logger } from '../logger.js'
import { getRedis } from '../redis.js'
import { workerOptions } from './index.js'

let logQueue: Queue | null = null

export const initializeLogQueue = () => {
    logQueue = new Queue('logs', { connection: getRedis() })
    logger.debug('initialized log queue')
}

const getLogQueue = () => {
    if (!logQueue) {
        throw Error('log queue not initialized')
    }
    return logQueue
}

export const addAppRequestToQueue = async (req: AppRequest) => {
    logger.debug('adding app request log job to queue')
    await getLogQueue().add('log', { type: LogJobType.AppRequestLog, log: req })
}

export const addPlaidLinkEventLogToQueue = async (event: PlaidLinkEvent) => {
    logger.debug('adding plaid link event log job to queue')
    await getLogQueue().add('log', {
        type: LogJobType.PlaidLinkEventLog,
        log: event,
    })
}

export const addPlaidApiRequestLogToQueue = async (req: PlaidApiRequest) => {
    logger.debug('adding plaid api request log job to queue')
    await getLogQueue().add('log', {
        type: LogJobType.PlaidApiRequestLog,
        log: req,
    })
}

export const addWebhookLogToQueue = async (webhook: object) => {
    logger.debug('adding webhook log job to queue')
    await getLogQueue().add('log', {
        type: LogJobType.WebhookLog,
        log: webhook,
    })
}

let logWorker: Worker | null = null

export const initializeLogWorker = () => {
    logWorker = new Worker(
        'logs',
        async (job) => {
            const type: LogJobType = job.data.type
            logger.debug(`starting ${type} log job (id ${job.id})`)
            switch (type) {
                case LogJobType.AppRequestLog: {
                    const req: AppRequest | undefined = job.data.log
                    if (!req) throw Error('missing app request')

                    const newReq = await createAppRequest(req)
                    if (!newReq) throw Error('failed to create app request log')
                    break
                }
                case LogJobType.PlaidLinkEventLog: {
                    const event: PlaidLinkEvent | undefined = job.data.log
                    if (!event) throw Error('missing plaid link event')

                    const newEvent = await createPlaidLinkEvent(event)
                    if (!newEvent)
                        throw Error('failed to create plaid link event log')
                    break
                }
                case LogJobType.PlaidApiRequestLog: {
                    const req: PlaidApiRequest | undefined = job.data.log
                    if (!req) throw Error('missing plaid api request')

                    const newReq = await createPlaidApiRequest(req)
                    if (!newReq)
                        throw Error('failed to create plaid api request log')
                    break
                }
                case LogJobType.WebhookLog: {
                    const webhook: Webhook | undefined = job.data.log
                    if (!webhook) throw Error('missing webhook')

                    const newWebhook = await createWebhook(webhook)
                    if (!newWebhook) throw Error('failed to create webhook log')
                    break
                }
                default:
                    logger.error('unknown log job type: ' + type)
                    break
            }
        },
        { connection: getRedis(), ...workerOptions }
    )

    logWorker.on('failed', (job, err) => {
        logger.error({ error: err }, `job (id ${job?.id}) failed`)
    })

    logWorker.on('completed', (job) => {
        logger.debug(`job (id ${job.id}) completed`)
    })

    logger.debug('initialized log worker')
}

export const closeLogWorker = async () => {
    if (!logWorker) {
        throw Error('log worker not initialized')
    }
    await logWorker.close()
    logger.debug('closed log worker')
}
