import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { Webhook } from '../models/webhook.js'
import { plaidVerifyWebhook } from '../plaid/webhookMethods.js'
import { queueWebhookLog } from '../queues/logQueue.js'
import { logger } from '../utils/logger.js'

export const handleWebhook = async (req: Request, res: Response) => {
    logger.debug('handling webhook')

    const token = req.headers['plaid-verification']
    if (typeof token !== 'string') {
        throw new HttpError('missing plaid signature', 400)
    }

    const body = JSON.stringify(req.body, null, 2)

    try {
        await plaidVerifyWebhook(token, body)
        logger.debug('verified webhook')
    } catch (error) {
        if (error instanceof Error) {
            throw new HttpError(error.message, 400)
        }
        throw new HttpError('failed to verify webhook', 400)
    }

    const webhook: Webhook = {
        id: -1,
        timestamp: new Date(),
        data: req.body,
    }
    await queueWebhookLog(webhook)

    // TODO add webhook to queue

    return res.status(202).send()
}
