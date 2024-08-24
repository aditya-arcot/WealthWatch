import { Queue, Worker } from 'bullmq'
import { handleWebhook } from '../controllers/webhookController.js'
import { HttpError } from '../models/httpError.js'
import { Webhook } from '../models/webhook.js'
import { vars } from '../utils/env.js'
import { logger } from '../utils/logger.js'
import { getRedis } from '../utils/redis.js'
import { handleJobFailure, handleJobSuccess, workerOptions } from './index.js'

const webhookQueueName = `webhook-${vars.nodeEnv}`
let webhookQueue: Queue | null = null
let webhookWorker: Worker | null = null

export const initializeWebhookQueue = () => {
    webhookQueue = new Queue(webhookQueueName, { connection: getRedis() })
    logger.debug('initialized webhook queue')
}

const getWebhookQueue = () => {
    if (!webhookQueue) {
        throw new HttpError('webhook queue not initialized')
    }
    return webhookQueue
}

export const queueWebhook = async (webhook: Webhook) => {
    logger.debug(`${webhookQueueName} queue - adding job`)
    await getWebhookQueue().add('Webhook', { webhook })
}

export const initializeWebhookWorker = () => {
    webhookWorker = new Worker(
        webhookQueueName,
        async (job) => {
            logger.debug(
                `${webhookQueueName} queue - starting job (id ${job.id})`
            )

            const webhook: Webhook | undefined = job.data.webhook
            if (!webhook) throw new HttpError('missing webhook')

            await handleWebhook(webhook)
        },
        { connection: getRedis(), ...workerOptions }
    )

    webhookWorker.on('completed', async (job) => {
        logger.debug(`${webhookQueueName} queue - completed job (id ${job.id})`)
        await handleJobSuccess(webhookQueueName, job.id, job.name, job.data)
    })

    webhookWorker.on('failed', async (job, err) => {
        logger.error(
            { err },
            `${webhookQueueName} queue - failed job (id ${job?.id})`
        )
        await handleJobFailure(webhookQueueName, job?.id, job?.data, err)
    })

    logger.debug('initialized webhook worker')
}

export const closeWebhookWorker = async () => {
    if (!webhookWorker) {
        logger.warn('webhook worker not initialized')
        return
    }
    await webhookWorker.close()
    logger.debug('closed webhook worker')
}
