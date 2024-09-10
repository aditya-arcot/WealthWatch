import { Request, Response } from 'express'
import { insertAccounts } from '../database/accountQueries.js'
import {
    fetchActiveItems,
    fetchActiveItemsWithUserId,
    fetchActiveItemWithPlaidId,
    modifyItemActiveWithId,
    modifyItemCursorLastSyncedLastRefreshedWithPlaidId,
    modifyItemLastRefreshedWithPlaidId,
} from '../database/itemQueries.js'
import {
    fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters,
    insertTransactions,
    removeTransactionsWithPlaidIds,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
import { Item, refreshCooldown } from '../models/item.js'
import {
    plaidAccountsBalanceGet,
    plaidAccountsGet,
} from '../plaid/accountMethods.js'
import { plaidItemRemove, plaidWebhookUpdate } from '../plaid/itemMethods.js'
import {
    mapPlaidTransaction,
    plaidTransactionsRefresh,
    plaidTransactionsSync,
} from '../plaid/transactionMethods.js'
import { queueRefreshItemBalances } from '../queues/itemQueue.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    return res.send(items)
}

export const updateActiveItemsWebhook = async (req: Request, res: Response) => {
    logger.debug('updating webhook for active items')

    const url = req.body.url
    if (typeof url !== 'string')
        throw new HttpError('missing or invalid url', 400)

    const items = await fetchActiveItems()
    await Promise.all(
        items.map(async (item) => await plaidWebhookUpdate(item, url))
    )

    return res.status(204).send()
}

export const refreshItem = async (req: Request, res: Response) => {
    logger.debug('refreshing item')

    const plaidItemId = req.params['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    await refreshItemTransactions(item)
    await queueRefreshItemBalances(item)

    return res.status(202).send()
}

export const refreshItemTransactions = async (item: Item) => {
    logger.debug('refreshing item transactions')

    if (item.lastRefreshed) {
        if (
            Date.now() - new Date(item.lastRefreshed).getTime() <
            refreshCooldown
        ) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }

    await plaidTransactionsRefresh(item)
    await modifyItemLastRefreshedWithPlaidId(item.plaidId, new Date())
}

export const refreshItemBalances = async (item: Item) => {
    logger.debug('refreshing item balances')

    if (item.lastRefreshed) {
        if (
            Date.now() - new Date(item.lastRefreshed).getTime() <
            refreshCooldown
        ) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }

    const accounts = await plaidAccountsBalanceGet(item)
    await insertAccounts(accounts, true)
    await modifyItemLastRefreshedWithPlaidId(item.plaidId, new Date())
}

export const deactivateItem = async (req: Request, res: Response) => {
    logger.debug('deactivating item')

    const plaidItemId = req.params['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await deactivateItemMain(item)

    return res.status(204).send()
}

export const deactivateItemMain = async (item: Item) => {
    logger.debug({ id: item.id }, 'removing & deactivating item')
    await plaidItemRemove(item)
    await modifyItemActiveWithId(item.id, false)
}

export const syncTransactions = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item transactions')

    const accounts = await plaidAccountsGet(item)
    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        const addedAccounts = await insertAccounts(accounts)
        if (!addedAccounts) throw new HttpError('failed to insert accounts')

        const { added, modified, removed, cursor } =
            await plaidTransactionsSync(item)

        added.concat(modified)
        if (added.length > 0) {
            logger.debug('inserting transactions')
            const existingTransactions = (
                await fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters(
                    item.userId
                )
            ).transactions
            const addTransactions = added.map((t) => {
                const account = addedAccounts.find(
                    (a) => a.plaidId === t.account_id
                )
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidTransaction(t, account.id, existingTransactions)
            })
            const addedTransactions = await insertTransactions(addTransactions)
            if (!addedTransactions)
                throw new HttpError('failed to insert transactions')
        }

        if (removed.length > 0) {
            logger.debug('removing transactions')
            const removeIds = removed.map((t) => t.transaction_id)
            const removedTransactions =
                await removeTransactionsWithPlaidIds(removeIds)
            if (!removedTransactions)
                throw new HttpError('failed to remove transactions')
        }

        logger.debug('updating cursor')
        await modifyItemCursorLastSyncedLastRefreshedWithPlaidId(
            item.plaidId,
            cursor,
            new Date()
        )
    } else {
        logger.debug('no accounts. skipping transaction updates')
    }
}
