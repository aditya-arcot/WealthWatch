import { Queue, Worker } from 'bullmq'
import { env } from 'process'
import { insertAppRequest } from '../database/appRequestQueries.js'
import { insertPlaidApiRequest } from '../database/plaidApiRequestQueries.js'
import { insertPlaidLinkEvent } from '../database/plaidLinkEventQueries.js'
import { insertWebhook } from '../database/webhookQueries.js'
import { AppRequest } from '../models/appRequest.js'
import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import { Webhook } from '../models/webhook.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

enum LogJobType {
    AppRequestLog = 'AppRequest',
    PlaidLinkEventLog = 'PlaidLinkEvent',
    PlaidApiRequestLog = 'PlaidApiRequest',
    WebhookLog = 'Webhook',
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

export const queueAppRequest = async (req: AppRequest) => {
    logger.debug('adding app request log job to queue')
    await getLogQueue().add('appRequestLog', {
        type: LogJobType.AppRequestLog,
        log: req,
    })
}

export const queuePlaidLinkEventLog = async (event: PlaidLinkEvent) => {
    logger.debug('adding plaid link event log job to queue')
    await getLogQueue().add('plaidLinkEventLog', {
        type: LogJobType.PlaidLinkEventLog,
        log: event,
    })
}

export const queuePlaidApiRequestLog = async (req: PlaidApiRequest) => {
    logger.debug('adding plaid api request log job to queue')
    await getLogQueue().add('plaidApiRequestLog', {
        type: LogJobType.PlaidApiRequestLog,
        log: req,
    })
}

export const queueWebhookLog = async (webhook: object) => {
    logger.debug('adding webhook log job to queue')
    await getLogQueue().add('webhookLog', {
        type: LogJobType.WebhookLog,
        log: webhook,
    })
}

export const initializeLogWorker = () => {
    logWorker = new Worker(
        logQueueName,
        async (job) => {
            const type: LogJobType = job.data.type
            logger.debug(`starting ${type} log job (id ${job.id})`)
            switch (type) {
                case LogJobType.AppRequestLog: {
                    const req: AppRequest | undefined = job.data.log
                    if (!req) throw Error('missing app request')

                    const newReq = await insertAppRequest(req)
                    if (!newReq) throw Error('failed to create app request log')
                    break
                }
                case LogJobType.PlaidLinkEventLog: {
                    const event: PlaidLinkEvent | undefined = job.data.log
                    if (!event) throw Error('missing plaid link event')

                    const newEvent = await insertPlaidLinkEvent(event)
                    if (!newEvent)
                        throw Error('failed to create plaid link event log')
                    break
                }
                case LogJobType.PlaidApiRequestLog: {
                    const req: PlaidApiRequest | undefined = job.data.log
                    if (!req) throw Error('missing plaid api request')

                    const newReq = await insertPlaidApiRequest(req)
                    if (!newReq)
                        throw Error('failed to create plaid api request log')
                    break
                }
                case LogJobType.WebhookLog: {
                    const webhook: Webhook | undefined = job.data.log
                    if (!webhook) throw Error('missing webhook')

                    const newWebhook = await insertWebhook(webhook)
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

    logWorker.on('completed', async (job) => {
        logger.debug(`job (id ${job.id}) completed`)
        await handleJobSuccess(logQueueName, job.id, job.name, job.data)
    })

    logWorker.on('failed', async (job, err) => {
        logger.error({ err }, `job (id ${job?.id}) failed`)
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
