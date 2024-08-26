import { Request, Response } from 'express'
import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import { fetchActiveItemByPlaidId } from '../database/itemQueries.js'
import {
    insertItemNotification,
    modifyNotificationsToInactiveByUserIdAndTypeId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/error.js'
import { NotificationTypeEnum } from '../models/notification.js'
import {
    ItemWebhookCodeEnum,
    TransactionsWebhookCodeEnum,
    Webhook,
    WebhookTypeEnum,
} from '../models/webhook.js'
import { plaidWebhookVerificationKeyGet } from '../plaid/webhookMethods.js'
import { queueWebhook } from '../queues/webhookQueue.js'
import { logger } from '../utils/logger.js'
import { deactivateItemMain, syncItemData } from './itemController.js'

export const processWebhook = async (req: Request, res: Response) => {
    logger.debug('processing webhook')

    const token = req.headers['plaid-verification']
    if (typeof token !== 'string') {
        throw new HttpError('missing or invalid plaid signature', 400)
    }

    const body = JSON.stringify(req.body, null, 2)

    await verifyWebhook(token, body)
    logger.debug('verified webhook')

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
        typeof decodedTokenHeader.kid !== 'string' ||
        typeof decodedTokenHeader.alg !== 'string' ||
        typeof decodedTokenHeader.typ !== 'string'
    ) {
        throw new HttpError('invalid jwt header', 400)
    }
    if (decodedTokenHeader.alg !== 'ES256') {
        throw new HttpError('missing or invalid algorithm', 400)
    }
    if (decodedTokenHeader.typ !== 'JWT') {
        throw new HttpError('missing or invalid type', 400)
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
        throw new HttpError('body hash does not match', 400)
    }
}

export const handleWebhook = async (webhook: Webhook) => {
    logger.debug({ webhook }, 'handling webhook')

    const webhookType = webhook.data.webhook_type
    if (typeof webhookType !== 'string')
        throw new HttpError('missing or invalid webhook type', 400)

    const webhookCode = webhook.data.webhook_code
    if (typeof webhookCode !== 'string')
        throw new HttpError('missing or invalid webhook code', 400)

    const webhookTypeEnum = webhookType as WebhookTypeEnum
    switch (webhookTypeEnum) {
        case WebhookTypeEnum.Transactions: {
            const itemId = webhook.data.item_id
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleTransactionsWebhook(webhookCode, itemId)
            break
        }
        case WebhookTypeEnum.Item: {
            const itemId = webhook.data.item_id
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleItemWebhook(webhookCode, itemId)
            break
        }
        default:
            throw new HttpError(`unhandled webhook type: ${webhookType}`, 400)
    }

    logger.debug({ timestamp: webhook.timestamp }, 'handled webhook')
}

const handleTransactionsWebhook = async (
    webhookCode: string,
    itemId: string
) => {
    logger.debug({ webhookCode, itemId }, 'handling transactions webhook')

    const webhookCodeEnum = webhookCode as TransactionsWebhookCodeEnum
    switch (webhookCodeEnum) {
        case TransactionsWebhookCodeEnum.SyncUpdatesAvailable: {
            await handleTransactionsSyncUpdatesWebhook(itemId)
            break
        }
        case TransactionsWebhookCodeEnum.RecurringTransactionsUpdate:
            throw new HttpError('not implemented', 501)
        case TransactionsWebhookCodeEnum.InitialUpdate:
        case TransactionsWebhookCodeEnum.HistoricalUpdate:
        case TransactionsWebhookCodeEnum.DefaultUpdate:
        case TransactionsWebhookCodeEnum.TransactionsRemoved:
            logger.debug('ignoring legacy transactions webhook')
            break
        default:
            throw new HttpError('unknown webhook code', 400)
    }

    logger.debug({ webhookCode, itemId }, 'handled transactions webhook')
}

const handleItemWebhook = async (webhookCode: string, itemId: string) => {
    logger.debug({ webhookCode, itemId }, 'handling item webhook')

    const webhookCodeEnum = webhookCode as ItemWebhookCodeEnum
    switch (webhookCodeEnum) {
        case ItemWebhookCodeEnum.Error: {
            await handleItemErrorWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.LoginRepaired: {
            await handleItemLoginRepairedWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.NewAccountsAvailable: {
            await handleItemNewAccountsAvailableWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.PendingExpiration: {
            await handleItemPendingExpirationWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.UserPermissionRevoked: {
            await handleUserPermissionRevokedWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.UserAccountRevoked: {
            await handleItemUserAccountRevokedWebhook(itemId)
            break
        }
        case ItemWebhookCodeEnum.WebhookUpdateAcknowledged:
            logger.debug('webhook update acknowledged')
            break

        default:
            throw new HttpError('unknown webhook code', 400)
    }

    logger.debug({ webhookCode, itemId }, 'handled item webhook')
}

const handleTransactionsSyncUpdatesWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling transactions sync webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await syncItemData(item)

    logger.debug({ itemId }, 'handled transactions sync webhook')
}

const handleItemErrorWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item error webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await insertItemNotification(
        NotificationTypeEnum.LinkUpdate,
        item,
        `${item.institutionName} connection error`,
        true
    )

    logger.debug({ itemId }, 'handled item error webhook')
}

const handleItemLoginRepairedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item login repaired webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await modifyNotificationsToInactiveByUserIdAndTypeId(
        item.userId,
        NotificationTypeEnum.LinkUpdate
    )

    await insertItemNotification(
        NotificationTypeEnum.Info,
        item,
        `${item.institutionName} connection repaired`
    )

    logger.debug({ itemId }, 'handled item login repaired webhook')
}

const handleItemNewAccountsAvailableWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item new accounts available webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await insertItemNotification(
        NotificationTypeEnum.LinkUpdateWithAccounts,
        item,
        `New ${item.institutionName} accounts available`
    )

    logger.debug({ itemId }, 'handled item new accounts available webhook')
}

const handleItemPendingExpirationWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item pending expiration webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await insertItemNotification(
        NotificationTypeEnum.LinkUpdate,
        item,
        `${item.institutionName} connection pending expiration`
    )

    logger.debug({ itemId }, 'handled item pending expiration webhook')
}

const handleUserPermissionRevokedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item user permission revoked webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await insertItemNotification(
        NotificationTypeEnum.LinkUpdate,
        item,
        `${item.institutionName} permission revoked`
    )

    logger.debug({ itemId }, 'handled user permission revoked webhook')
}

const handleItemUserAccountRevokedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item user account revoked webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await insertItemNotification(
        NotificationTypeEnum.Info,
        item,
        `${item.institutionName} user account revoked`
    )
    await deactivateItemMain(item)

    logger.debug({ itemId }, 'handled user account revoked webhook')
}
