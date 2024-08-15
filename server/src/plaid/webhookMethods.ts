import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import {
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum,
} from 'plaid'
import { fetchActiveItemById } from '../database/itemQueries.js'
import { Item } from '../models/item.js'
import { TransactionsWebhookCodeEnum } from '../models/webhook.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'
import { plaidSyncItemData } from './itemMethods.js'

export const plaidFireWebhook = async (item: Item, code: WebhookCodeEnum) => {
    logger.debug({ item, code }, 'firing webhook')
    const params: SandboxItemFireWebhookRequest = {
        access_token: item.accessToken,
        webhook_code: code,
    }
    const resp = await executePlaidMethod(
        plaidClient.sandboxItemFireWebhook,
        params,
        item.userId,
        item.id
    )
    return resp.data.webhook_fired
}

export const plaidVerifyWebhook = async (
    token: string,
    body: string
): Promise<void> => {
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

    const params = { key_id: decodedTokenHeader.kid }
    const resp = await executePlaidMethod(
        plaidClient.webhookVerificationKeyGet,
        params
    )
    const plaidJwk = resp.data.key

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

export const plaidHandleTransactionsWebhook = async (
    webhookCode: string,
    itemId: string
) => {
    logger.debug({ webhookCode, itemId }, 'handling transactions webhook')
    const webhookCodeEnum = webhookCode as TransactionsWebhookCodeEnum

    switch (webhookCodeEnum) {
        case TransactionsWebhookCodeEnum.SyncUpdatesAvailable: {
            const item = await fetchActiveItemById(itemId)
            if (!item) throw Error('item not found')
            await plaidSyncItemData(item)
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
