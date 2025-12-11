import { handleWebhook } from '@controllers'
import { Webhook } from '@models'
import { handleJobFailure, handleJobSuccess, workerOptions } from '@queues'
import { getRedis, logger, vars } from '@utilities'
import { Queue, Worker } from 'bullmq'

interface WebhookJobData {
    webhook?: Webhook
}

let webhookQueue: Queue | null = null
let webhookWorker: Worker | null = null

const getQueueName = () => `webhook-${vars.nodeEnv}`

export const initializeWebhookQueue = () => {
    webhookQueue = new Queue(getQueueName(), { connection: getRedis() })
    logger.debug('initialized webhook queue')
}

const getQueue = () => {
    if (!webhookQueue) {
        throw Error('webhook queue not initialized')
    }
    return webhookQueue
}

export const queueWebhook = async (webhook: Webhook) => {
    logger.debug(`${getQueueName()} queue - adding job`)
    await getQueue().add('Webhook', { webhook })
}

export const initializeWebhookWorker = () => {
    webhookWorker = new Worker<WebhookJobData>(
        getQueueName(),
        async (job) => {
            logger.debug(
                `${getQueueName()} queue - starting job (id ${String(job.id)})`
            )

            const webhook: Webhook | undefined = job.data.webhook
            if (!webhook) throw Error('missing webhook')

            await handleWebhook(webhook)
        },
        { connection: getRedis(), ...workerOptions }
    )

    webhookWorker.on('completed', (job) => {
        logger.debug(
            `${getQueueName()} queue - completed job (id ${String(job.id)})`
        )
        handleJobSuccess(
            getQueueName(),
            job.id,
            job.name,
            job.data as WebhookJobData
        ).catch((err: unknown) => {
            logger.error(err, `error handling job success`)
        })
    })

    webhookWorker.on('failed', (job, err) => {
        logger.error(
            { err },
            `${getQueueName()} queue - failed job (id ${String(job?.id)})`
        )
        handleJobFailure(
            getQueueName(),
            job?.id,
            job?.name,
            job?.data as WebhookJobData,
            err
        ).catch((err: unknown) => {
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
