import { Request, Response } from 'express'
import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import {
    fetchActiveItemById,
    modifyItemActiveById,
} from '../database/itemQueries.js'
import {
    fetchActiveNotificationsByUserId,
    insertItemNotification,
    updateNotificationsToInactiveByUserIdAndNotificationIds,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/httpError.js'
import { NotificationTypeEnum } from '../models/notification.js'
import {
    ItemWebhookCodeEnum,
    TransactionsWebhookCodeEnum,
    Webhook,
    WebhookTypeEnum,
} from '../models/webhook.js'
import { plaidItemRemove } from '../plaid/itemMethods.js'
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
        case WebhookTypeEnum.Item: {
            const itemId: string | undefined = webhook.data.item_id
            if (itemId === undefined) throw Error('missing item id')
            await handleItemWebhook(webhookCode, itemId)
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
            logger.debug({ itemId }, 'handling transactions sync webhook')
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

const handleItemWebhook = async (webhookCode: string, itemId: string) => {
    logger.debug({ webhookCode, itemId }, 'handling item webhook')
    const webhookCodeEnum = webhookCode as ItemWebhookCodeEnum

    const item = await fetchActiveItemById(itemId)
    if (!item) throw Error('item not found')

    switch (webhookCodeEnum) {
        case ItemWebhookCodeEnum.Error: {
            logger.debug({ itemId }, 'handling item error webhook')

            const message = `${item.institutionName} connection error`
            await insertItemNotification(
                NotificationTypeEnum.LinkUpdateRequired,
                item,
                message
            )

            logger.debug({ itemId }, 'handled item error webhook')
            break
        }

        case ItemWebhookCodeEnum.LoginRepaired: {
            logger.debug({ itemId }, 'handling item login repaired webhook')

            const notifications = await fetchActiveNotificationsByUserId(
                item.userId
            )
            const filteredIds = notifications
                .filter(
                    (n) => n.typeId === NotificationTypeEnum.LinkUpdateRequired
                )
                .filter((n) => n.itemId === item.id)
                .map((n) => n.id)
            if (filteredIds.length === 0) {
                logger.debug('no matching update required notifications found')
            } else {
                await updateNotificationsToInactiveByUserIdAndNotificationIds(
                    item.userId,
                    filteredIds
                )
            }

            const message = `${item.institutionName} connection repaired`
            await insertItemNotification(
                NotificationTypeEnum.Info,
                item,
                message
            )

            logger.debug({ itemId }, 'handled item login repaired webhook')
            break
        }

        case ItemWebhookCodeEnum.NewAccountsAvailable: {
            logger.debug(
                { itemId },
                'handling item new accounts available webhook'
            )

            const message = `New ${item.institutionName} accounts available`
            await insertItemNotification(
                NotificationTypeEnum.LinkUpdateOptionalNewAccounts,
                item,
                message
            )

            logger.debug(
                { itemId },
                'handled item new accounts available webhook'
            )
            break
        }

        case ItemWebhookCodeEnum.PendingExpiration: {
            logger.debug({ itemId }, 'handling item pending expiration webhook')

            const message = `${item.institutionName} connection pending expiration`
            await insertItemNotification(
                NotificationTypeEnum.LinkUpdateOptional,
                item,
                message
            )

            logger.debug({ itemId }, 'handled item pending expiration webhook')
            break
        }

        case ItemWebhookCodeEnum.UserPermissionRevoked: {
            logger.debug(
                { itemId },
                'handling item user permission revoked webhook'
            )

            const message = `${item.institutionName} permission revoked`
            await insertItemNotification(
                NotificationTypeEnum.LinkUpdateOptional,
                item,
                message
            )

            logger.debug({ itemId }, 'handled user permission revoked webhook')
            break
        }

        case ItemWebhookCodeEnum.UserAccountRevoked: {
            logger.debug(
                { itemId },
                'handling item user account revoked webhook'
            )

            const message = `${item.institutionName} user account revoked`
            await insertItemNotification(
                NotificationTypeEnum.Info,
                item,
                message
            )

            await plaidItemRemove(item)
            await modifyItemActiveById(item.id, false)

            logger.debug({ itemId }, 'handled user account revoked webhook')
            break
        }

        case ItemWebhookCodeEnum.WebhookUpdateAcknowledged:
            logger.debug('webhook update acknowledged')
            break

        default:
            throw Error('unknown webhook code')
    }
}
