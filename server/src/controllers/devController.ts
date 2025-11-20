import {
    refreshItemInvestments,
    refreshItemTransactions,
    removeDeactivateItem,
    syncItemData,
} from '@controllers/itemController.js'
import {
    fetchActiveItemByPlaidId,
    fetchActiveItemByUserIdAndInstitutionId,
    fetchActiveItemsByUserId,
    insertItem,
} from '@database/itemQueries.js'
import { fetchUsers, removeUserById } from '@database/userQueries.js'
import { HttpError } from '@models/error.js'
import { plaidSandboxResetLogin } from '@plaid/itemMethods.js'
import {
    plaidPublicTokenExchange,
    plaidSandboxPublicTokenCreate,
} from '@plaid/tokenMethods.js'
import { plaidSandboxFireWebhook } from '@plaid/webhookMethods.js'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
    queueSyncItemLiabilities,
    queueSyncItemTransactions,
} from '@queues/itemQueue.js'
import { logger } from '@utilities/logger.js'
import { Item } from '@wealthwatch-shared'
import { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum } from 'plaid'

export const devDeleteAllUsers = async (req: Request, res: Response) => {
    logger.debug('deleting all users')
    await deactivateItems(true)
    req.session.destroy(() => res.status(204).send())
}

export const devDeactivateAllItems = async (_req: Request, res: Response) => {
    logger.debug('deactivating all items')
    await deactivateItems()
    return res.status(204).send()
}

export const devCreateSandboxItem = async (req: Request, res: Response) => {
    logger.debug('creating sandbox item')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const institutionId = 'ins_56'
    const institutionName = 'Chase'
    const existingItem = await fetchActiveItemByUserIdAndInstitutionId(
        user.id,
        institutionId
    )
    if (existingItem) throw new HttpError('item already linked', 409)

    const publicToken = await plaidSandboxPublicTokenCreate(user, institutionId)
    const { accessToken, plaidItemId } = await plaidPublicTokenExchange(
        publicToken,
        user.id
    )

    const item: Item = {
        id: -1,
        userId: user.id,
        plaidId: plaidItemId,
        active: true,
        accessToken,
        institutionId,
        institutionName,
        healthy: true,
        cursor: null,
        lastRefreshed: null,
        transactionsLastRefreshed: null,
        investmentsLastRefreshed: null,
    }
    const newItem = await insertItem(item)
    if (!newItem) throw new HttpError('failed to insert item')

    await syncItemData(newItem)

    return res.status(202).send()
}

export const devForceRefreshItemTransactions = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item transactions')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemTransactions(item, false)

    return res.status(204).send()
}

export const devForceRefreshItemInvestments = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item investments')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemInvestments(item, false)

    res.status(204).send()
}

export const devSyncItem = async (req: Request, res: Response) => {
    logger.debug('syncing item')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await syncItemData(item)

    return res.status(202).send()
}

export const devSyncItemTransactions = async (req: Request, res: Response) => {
    logger.debug('syncing item transactions')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemTransactions(item, true)

    return res.status(202).send()
}

export const devSyncItemInvestments = async (req: Request, res: Response) => {
    logger.debug('syncing item investments')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemInvestments(item, true)

    return res.status(202).send()
}

export const devSyncItemLiabilities = async (req: Request, res: Response) => {
    logger.debug('syncing item liabilities')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemLiabilities(item, true)

    return res.status(202).send()
}

export const devSyncItemBalances = async (req: Request, res: Response) => {
    logger.debug('syncing item balances')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemBalances(item)

    return res.status(202).send()
}

export const devResetSandboxItemLogin = async (req: Request, res: Response) => {
    logger.debug('resetting sandbox item login')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const reset = await plaidSandboxResetLogin(item)
    if (!reset) throw new HttpError('failed to reset item login')

    return res.status(204).send()
}

export const devFireSandboxWebhook = async (req: Request, res: Response) => {
    logger.debug('firing sandbox webhook')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const code = req.query['code']
    if (typeof code !== 'string')
        throw new HttpError('missing or invalid webhook code', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const validCodes: string[] = [...Object.values(WebhookCodeEnum)]
    if (!validCodes.includes(code)) {
        throw new HttpError('invalid webhook code', 400)
    }

    const fired = await plaidSandboxFireWebhook(item, code as WebhookCodeEnum)
    if (!fired) throw new HttpError('failed to fire webhook')

    return res.status(204).send()
}

const deactivateItems = async (deleteUsers = false) => {
    const users = await fetchUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ id: user.id }, 'deactivating user items')

            const items = await fetchActiveItemsByUserId(user.id)
            await Promise.all(
                items.map(async (item) => {
                    await removeDeactivateItem(item)
                })
            )

            if (deleteUsers) {
                logger.debug({ id: user.id }, 'deleting user')
                await removeUserById(user.id)
            }
        })
    )
}
