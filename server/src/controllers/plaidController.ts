import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata, WebhookType } from 'plaid'
import { HttpError } from '../models/httpError.js'
import { retrieveItemByUserIdAndInstitutionId } from '../models/item.js'
import { createPlaidLinkEvent, PlaidLinkEvent } from '../models/plaid.js'
import {
    createLinkToken,
    exchangePublicTokenAndCreateItemAndSync,
    verifyWebhook,
} from '../services/plaidService.js'
import { logger } from '../utils/logger.js'

export const getLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId: number | undefined = req.session.user?.id
    const itemId: string | undefined = req.body.itemId

    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const token = await createLinkToken(userId, itemId)
        return res.send({ linkToken: token })
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link token')
    }
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')

    const event: PlaidLinkEvent | undefined = req.body.event
    if (!event) throw new HttpError('missing event', 400)

    try {
        const newEvent = await createPlaidLinkEvent(event)
        if (!newEvent) throw Error('event not created')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link event')
    }
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

    const item = await retrieveItemByUserIdAndInstitutionId(
        userId,
        institution.institution_id
    )
    if (item) throw new HttpError('account already exists', 409)

    try {
        await exchangePublicTokenAndCreateItemAndSync(
            userId,
            institution.institution_id,
            institution.name,
            publicToken
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to exchange public token')
    }
}

export const handleWebhook = async (req: Request, _res: Response) => {
    logger.debug('received webhook')

    const token = req.headers['plaid-verification']
    if (typeof token !== 'string') {
        throw new HttpError('missing plaid signature', 400)
    }
    const body = JSON.stringify(req.body, null, 2)

    try {
        await verifyWebhook(token, body)
        logger.debug('verified webhook')
    } catch (error) {
        if (error instanceof Error) {
            throw new HttpError(error.message, 400)
        }
        throw new HttpError('failed to verify webhook', 400)
    }

    const webhookType: WebhookType | undefined = req.body.webhook_type
    const webhookCode: string | undefined = req.body.webhook_code

    logger.debug(`webhook - type: ${webhookType}, code: ${webhookCode}`)

    switch (webhookType) {
        case WebhookType.Assets: {
            throw new HttpError('assets webhook', 501)
        }
        case WebhookType.Auth: {
            throw new HttpError('auth webhook', 501)
        }
        case WebhookType.Holdings: {
            throw new HttpError('holdings webhook', 501)
        }
        case WebhookType.InvestmentsTransactions: {
            throw new HttpError('investments transactions webhook', 501)
        }
        case WebhookType.Item: {
            throw new HttpError('item webhook', 501)
        }
        case WebhookType.Liabilities: {
            throw new HttpError('liabilities webhook', 501)
        }
        case WebhookType.Transactions: {
            throw new HttpError('transactions webhook', 501)
        }
        default: {
            throw new HttpError('unhandled webhook', 400)
        }
    }
}
