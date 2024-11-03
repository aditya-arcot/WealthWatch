import { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum } from 'plaid'
import {
    fetchActiveItemWithPlaidId,
    fetchActiveItemWithUserIdAndInstitutionId,
    fetchActiveItemsWithUserId,
    insertItem,
} from '../database/itemQueries.js'
import { fetchUsers, removeUserWithId } from '../database/userQueries.js'
import { HttpError } from '../models/error.js'
import { Item } from '../models/item.js'
import { plaidSandboxResetLogin } from '../plaid/itemMethods.js'
import {
    plaidPublicTokenExchange,
    plaidSandboxPublicTokenCreate,
} from '../plaid/tokenMethods.js'
import { plaidSandboxFireWebhook } from '../plaid/webhookMethods.js'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
    queueSyncItemLiabilities,
    queueSyncItemTransactions,
} from '../queues/itemQueue.js'
import { logger } from '../utils/logger.js'
import {
    refreshItemInvestments,
    refreshItemTransactions,
    removeDeactivateItem,
    syncItemAccounts,
} from './itemController.js'

export const deleteAllUsers = async (req: Request, res: Response) => {
    logger.debug('deleting all users')
    await deactivateItems(true)
    req.session.destroy(() => res.status(204).send())
}

export const deactivateAllItems = async (_req: Request, res: Response) => {
    logger.debug('deactivating all items')
    await deactivateItems()
    return res.status(204).send()
}

const deactivateItems = async (deleteUsers = false) => {
    const users = await fetchUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ id: user.id }, 'deactivating user items')

            const items = await fetchActiveItemsWithUserId(user.id)
            await Promise.all(
                items.map(async (item) => {
                    await removeDeactivateItem(item)
                })
            )

            if (deleteUsers) {
                logger.debug({ id: user.id }, 'deleting user')
                await removeUserWithId(user.id)
            }
        })
    )
}

export const createSandboxItem = async (req: Request, res: Response) => {
    logger.debug('creating sandbox item')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const institutionId = 'ins_56'
    const institutionName = 'Chase'
    const existingItem = await fetchActiveItemWithUserIdAndInstitutionId(
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

    await syncItemAccounts(newItem)

    logger.debug('queueing item syncs')
    await queueSyncItemTransactions(newItem)
    await queueSyncItemInvestments(newItem)
    await queueSyncItemLiabilities(newItem)
    await queueSyncItemBalances(newItem)

    return res.status(204).send()
}

export const forceRefreshItemTransactions = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item transactions')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemTransactions(item, false)

    return res.status(204).send()
}

export const forceRefreshItemInvestments = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item investments')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemInvestments(item, false)

    res.status(204).send()
}

export const syncItemTransactions = async (req: Request, res: Response) => {
    logger.debug('syncing item transactions')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemTransactions(item, true)

    return res.status(202).send()
}

export const syncItemInvestments = async (req: Request, res: Response) => {
    logger.debug('syncing item investments')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemInvestments(item, true)

    return res.status(202).send()
}

export const syncItemLiabilities = async (req: Request, res: Response) => {
    logger.debug('syncing item liabilities')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemLiabilities(item, true)

    return res.status(202).send()
}

export const syncItemBalances = async (req: Request, res: Response) => {
    logger.debug('syncing item balances')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemBalances(item)

    return res.status(202).send()
}

export const resetSandboxItemLogin = async (req: Request, res: Response) => {
    logger.debug('resetting sandbox item login')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const reset = await plaidSandboxResetLogin(item)
    if (!reset) throw new HttpError('failed to reset item login')

    return res.status(204).send()
}

export const fireSandboxWebhook = async (req: Request, res: Response) => {
    logger.debug('firing sandbox webhook')

    const plaidItemId = req.query['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const code = req.query['code']
    if (typeof code !== 'string')
        throw new HttpError('missing or invalid webhook code', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const validCodes: string[] = [...Object.values(WebhookCodeEnum)]
    if (!validCodes.includes(code)) {
        throw new HttpError('invalid webhook code', 400)
    }

    const fired = await plaidSandboxFireWebhook(item, code as WebhookCodeEnum)
    if (!fired) throw new HttpError('failed to fire webhook')

    return res.status(204).send()
}
