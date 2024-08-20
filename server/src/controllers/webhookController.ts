import { Request, Response } from 'express'
import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import { fetchActiveItemById } from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import {
    TransactionsWebhookCodeEnum,
    Webhook,
    WebhookTypeEnum,
} from '../models/webhook.js'
import { plaidWebhookVerificationKeyGet } from '../plaid/webhookMethods.js'
import { queueWebhook } from '../queues/webhookQueue.js'
import { logger } from '../utils/logger.js'
import { syncItemData } from './itemController.js'

export const handleWebhook = async (req: Request, res: Response) => {
    logger.debug('handling webhook')

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

    const webhook: Webhook = {
        id: -1,
        timestamp: new Date(),
        data: req.body,
    }
    await queueWebhook(webhook)

    return res.status(202).send()
}

const verifyWebhook = async (token: string, body: string): Promise<void> => {
    logger.debug('verifying webhook')

    const decodedTokenHeader = jwtDecode(token, { header: true })
    if (
        decodedTokenHeader.kid === undefined ||
        decodedTokenHeader.alg === undefined ||
        decodedTokenHeader.typ === undefined
    ) {
        throw Error('invalid jwt header')
    }
    if (decodedTokenHeader.alg !== 'ES256') {
        throw Error('invalid algorithm')
    }
    if (decodedTokenHeader.typ !== 'JWT') {
        throw Error('invalid type')
    }

    const plaidJwk = await plaidWebhookVerificationKeyGet(
        decodedTokenHeader.kid
    )
    const joseJwk: JWK = {
        alg: plaidJwk.alg,
        crv: plaidJwk.crv,
        kid: plaidJwk.kid,
        kty: plaidJwk.kty,
        use: plaidJwk.use,
        x: plaidJwk.x,
        y: plaidJwk.y,
    }
    const keyLike = await importJWK(joseJwk)

    const { payload } = await jwtVerify(token, keyLike, {
        maxTokenAge: '5 min',
    })
    if (sha256(body) !== payload['request_body_sha256']) {
        throw Error('body hash does not match')
    }
}

export const processWebhook = async (webhook: Webhook) => {
    logger.debug({ webhook }, 'processing webhook')

    const webhookType: string | undefined = webhook.data.webhook_type
    const webhookCode: string | undefined = webhook.data.webhook_code

    if (webhookType === undefined || webhookCode === undefined) {
        throw Error('missing webhook type or code')
    }

    const webhookTypeEnum = webhookType as WebhookTypeEnum

    switch (webhookTypeEnum) {
        case WebhookTypeEnum.Transactions: {
            const itemId: string | undefined = webhook.data.item_id
            if (itemId === undefined) throw Error('missing item id')
            await handleTransactionsWebhook(webhookCode, itemId)
            break
        }
        default:
            throw Error(`unhandled webhook type: ${webhookType}`)
    }

    logger.debug('processed webhook')
}

const handleTransactionsWebhook = async (
    webhookCode: string,
    itemId: string
) => {
    logger.debug({ webhookCode, itemId }, 'handling transactions webhook')
    const webhookCodeEnum = webhookCode as TransactionsWebhookCodeEnum

    switch (webhookCodeEnum) {
        case TransactionsWebhookCodeEnum.SyncUpdatesAvailable: {
            const item = await fetchActiveItemById(itemId)
            if (!item) throw Error('item not found')
            await syncItemData(item)
            logger.debug({ itemId }, 'handled transactions sync webhook')
            break
        }

        case TransactionsWebhookCodeEnum.RecurringTransactionsUpdate:
            throw Error('not implemented')

        case TransactionsWebhookCodeEnum.InitialUpdate:
        case TransactionsWebhookCodeEnum.HistoricalUpdate:
        case TransactionsWebhookCodeEnum.DefaultUpdate:
        case TransactionsWebhookCodeEnum.TransactionsRemoved:
            logger.debug('ignoring legacy transactions webhook')
            break

        default:
            throw Error('unknown webhook code')
    }

    logger.debug({ webhookCode, itemId }, 'handled transactions webhook')
}
