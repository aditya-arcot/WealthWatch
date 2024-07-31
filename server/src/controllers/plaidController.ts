import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata } from 'plaid'
import {
    fetchItemByUserIdAndInstitutionId,
    insertItem,
} from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import { Webhook } from '../models/webhook.js'
import {
    plaidCreateLinkToken,
    plaidExchangePublicToken,
} from '../plaid/tokenMethods.js'
import { plaidVerifyWebhook } from '../plaid/webhookMethods.js'
import { queueItemSync } from '../queues/itemSyncQueue.js'
import { queuePlaidLinkEventLog, queueWebhookLog } from '../queues/logQueue.js'
import { logger } from '../utils/logger.js'

export const createLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    const itemId: string | undefined = req.body.itemId

    try {
        const token = await plaidCreateLinkToken(userId, itemId)
        return res.send({ linkToken: token })
    } catch (error) {
        logger.error(error)
        throw Error('failed to create link token')
    }
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')

    const event: PlaidLinkEvent | undefined = req.body.event
    if (!event) throw new HttpError('missing event', 400)

    await queuePlaidLinkEventLog(event)
    return res.status(202).send()
}

export const exchangePublicToken = async (req: Request, res: Response) => {
    logger.debug('exchanging public token')

    const userId: number | undefined = req.session.user?.id
    const publicToken: string | undefined = req.body.publicToken
    const metadata: LinkSessionSuccessMetadata | undefined = req.body.metadata
    const institution = metadata?.institution

    if (!userId) throw new HttpError('missing user id', 400)
    if (!publicToken) throw new HttpError('missing public token', 400)
    if (!metadata) throw new HttpError('missing metadata', 400)
    if (!institution || !institution.institution_id || !institution.name)
        throw new HttpError('missing institution info', 400)

    try {
        const existingItem = await fetchItemByUserIdAndInstitutionId(
            userId,
            institution.institution_id
        )
        if (existingItem) throw new HttpError('account already exists', 409)

        const { accessToken, itemId } = await plaidExchangePublicToken(
            publicToken,
            userId
        )

        const item = await insertItem(
            userId,
            itemId,
            accessToken,
            institution.institution_id,
            institution.name
        )
        if (!item) throw Error('item not created')

        await queueItemSync(item)

        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to exchange public token')
    }
}

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
