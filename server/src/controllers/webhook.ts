import {
    insertInfoNotification,
    insertLinkUpdateNotification,
    insertLinkUpdateWithAccountsNotification,
    removeDeactivateItem,
} from '@controllers'
import {
    fetchActiveItemByPlaidId,
    modifyItemHealthyById,
    modifyNotificationsToInactiveByTypeIdUserIdAndItemId,
} from '@database'
import {
    HoldingsWebhookCodeEnum,
    ItemWebhookCodeEnum,
    LiabilitiesWebhookCodeEnum,
    TransactionsWebhookCodeEnum,
    WebhookTypeEnum,
} from '@enums'
import { HttpError, mapPlaidWebhook, Webhook } from '@models'
import { plaidWebhookVerificationKeyGet } from '@plaid'
import {
    queueSyncItemInvestments,
    queueSyncItemLiabilities,
    queueSyncItemTransactions,
    queueWebhook,
} from '@queues'
import { logger, validate } from '@utilities'
import {
    NotificationTypeEnum,
    ProcessWebhookBodySchema,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'
import { importJWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import { JWKPublicKey } from 'plaid'

const webhookKeyCache = new Map<string, JWKPublicKey>()

export const processWebhook = async (req: Request, res: Response) => {
    logger.debug('processing webhook')

    const token = req.headers['plaid-verification']
    if (typeof token !== 'string') {
        throw new HttpError('missing or invalid plaid signature', 400)
    }

    const body = validate(req.body, ProcessWebhookBodySchema)

    const bodyString = JSON.stringify(body, null, 2)
    await verifyWebhook(token, bodyString)

    const webhook = mapPlaidWebhook(body)
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

    const { kid } = decodedTokenHeader

    let plaidJwk = webhookKeyCache.get(kid)
    if (!plaidJwk) {
        const idsToUpdate = [kid]
        webhookKeyCache.forEach((key, id) => {
            if (key.expired_at === null) idsToUpdate.push(id)
        })

        await Promise.all(
            idsToUpdate.map(async (id) => {
                try {
                    const jwk = await plaidWebhookVerificationKeyGet(id)
                    webhookKeyCache.set(id, jwk)
                } catch (error) {
                    logger.error(error, `failed to fetch key for id ${id}`)
                }
            })
        )

        plaidJwk = webhookKeyCache.get(kid)
    }

    if (!plaidJwk) {
        throw new HttpError('key not found', 400)
    }
    if (plaidJwk.expired_at !== null) {
        throw new HttpError('key expired', 400)
    }

    const joseJwk = {
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

    logger.debug('verified webhook')
}

export const handleWebhook = async (webhook: Webhook) => {
    logger.debug({ webhook }, 'handling webhook')

    const webhookType = webhook.type
    if (typeof webhookType !== 'string')
        throw new HttpError('missing or invalid webhook type', 400)

    const webhookCode = webhook.code
    if (typeof webhookCode !== 'string')
        throw new HttpError('missing or invalid webhook code', 400)

    const webhookTypeEnum = webhookType as WebhookTypeEnum
    switch (webhookTypeEnum) {
        case WebhookTypeEnum.Transactions: {
            const itemId = webhook.itemId
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleTransactionsWebhook(webhookCode, itemId)
            break
        }
        case WebhookTypeEnum.Holdings: {
            const itemId = webhook.itemId
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleHoldingsWebhook(webhookCode, itemId)
            break
        }
        case WebhookTypeEnum.Liabilities: {
            const itemId = webhook.itemId
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleLiabilitiesWebhook(webhookCode, itemId)
            break
        }
        case WebhookTypeEnum.Item: {
            const itemId = webhook.itemId
            if (itemId === undefined)
                throw new HttpError('missing item id', 400)
            await handleItemWebhook(webhookCode, itemId)
            break
        }
        default:
            throw new HttpError(`unhandled webhook type: ${webhookType}`, 400)
    }

    logger.debug({ webhookTimestamp: webhook.timestamp }, 'handled webhook')
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

const handleHoldingsWebhook = async (webhookCode: string, itemId: string) => {
    logger.debug({ webhookCode, itemId }, 'handling holdings webhook')

    const webhookCodeEnum = webhookCode as HoldingsWebhookCodeEnum
    switch (webhookCodeEnum) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case HoldingsWebhookCodeEnum.DefaultUpdate: {
            await handleHoldingsDefaultUpdateWebhook(itemId)
            break
        }
        default:
            throw new HttpError('unknown webhook code', 400)
    }
}

const handleLiabilitiesWebhook = async (
    webhookCode: string,
    itemId: string
) => {
    logger.debug({ webhookCode, itemId }, 'handling liabilities webhook')

    const webhookCodeEnum = webhookCode as LiabilitiesWebhookCodeEnum
    switch (webhookCodeEnum) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case LiabilitiesWebhookCodeEnum.DefaultUpdate: {
            await handleLiabilitiesDefaultUpdateWebhook(itemId)
            break
        }
        default:
            throw new HttpError('unknown webhook code', 400)
    }
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
    await queueSyncItemTransactions(item, true)

    logger.debug({ itemId }, 'handled transactions sync webhook')
}

const handleHoldingsDefaultUpdateWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling holdings default webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemInvestments(item, true)

    logger.debug({ itemId }, 'handled holdings default webhook')
}

const handleLiabilitiesDefaultUpdateWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling liabilities default webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemLiabilities(item, true)

    logger.debug({ itemId }, 'handled liabilities default webhook')
}

const handleItemErrorWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item error webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await modifyItemHealthyById(item.id, false)

    const message = `${item.institutionName} connection error`
    await insertLinkUpdateNotification(item, message)

    logger.debug({ itemId }, 'handled item error webhook')
}

const handleItemLoginRepairedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item login repaired webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await modifyItemHealthyById(item.id, true)

    await modifyNotificationsToInactiveByTypeIdUserIdAndItemId(
        NotificationTypeEnum.LinkUpdate,
        item.userId,
        item.id
    )

    const message = `${item.institutionName} connection repaired`
    await insertInfoNotification(item, message)

    logger.debug({ itemId }, 'handled item login repaired webhook')
}

const handleItemNewAccountsAvailableWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item new accounts available webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    const message = `New ${item.institutionName} accounts available`
    await insertLinkUpdateWithAccountsNotification(item, message)

    logger.debug({ itemId }, 'handled item new accounts available webhook')
}

const handleItemPendingExpirationWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item pending expiration webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    const message = `${item.institutionName} connection pending expiration`
    await insertLinkUpdateNotification(item, message)

    logger.debug({ itemId }, 'handled item pending expiration webhook')
}

const handleUserPermissionRevokedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item user permission revoked webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await modifyItemHealthyById(item.id, false)

    await removeDeactivateItem(item)

    const message = `${item.institutionName} permission revoked. Data will be removed`
    await insertInfoNotification(item, message)

    logger.debug({ itemId }, 'handled user permission revoked webhook')
}

const handleItemUserAccountRevokedWebhook = async (itemId: string) => {
    logger.debug({ itemId }, 'handling item user account revoked webhook')

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await modifyItemHealthyById(item.id, false)

    const message = `${item.institutionName} user account revoked`
    await insertLinkUpdateNotification(item, message)

    logger.debug({ itemId }, 'handled user account revoked webhook')
}
