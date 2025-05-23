import { Queue, Worker } from 'bullmq'
import { handleWebhook } from '../controllers/webhookController.js'
import { Webhook } from '../models/webhook.js'
import { vars } from '../utilities/env.js'
import { logger } from '../utilities/logger.js'
import { getRedis } from '../utilities/redis.js'
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
        throw Error('webhook queue not initialized')
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
            if (!webhook) throw Error('missing webhook')

            await handleWebhook(webhook)
        },
        { connection: getRedis(), ...workerOptions }
    )

    webhookWorker.on('completed', (job) => {
        logger.debug(`${webhookQueueName} queue - completed job (id ${job.id})`)
        handleJobSuccess(webhookQueueName, job.id, job.name, job.data).catch(
            (err) => {
                logger.error(err, `error handling job success`)
            }
        )
    })

    webhookWorker.on('failed', (job, err) => {
        logger.error(
            { err },
            `${webhookQueueName} queue - failed job (id ${job?.id})`
        )
        handleJobFailure(
            webhookQueueName,
            job?.id,
            job?.name,
            job?.data,
            err
        ).catch((err) => {
            logger.error(err, `error handling job failure`)
        })
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
