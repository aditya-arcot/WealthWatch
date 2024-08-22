import { Request, Response } from 'express'
import { insertAccounts } from '../database/accountQueries.js'
import {
    fetchActiveItemByPlaidId,
    fetchActiveItems,
    fetchActiveItemsByUserId,
    modifyItemActiveById,
    modifyItemDataByPlaidId,
    modifyItemLastRefreshedByPlaidId,
} from '../database/itemQueries.js'
import {
    fetchActiveTransactionsByUserId,
    insertTransactions,
    removeTransactionsByPlaidIds,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/httpError.js'
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
import { queueItemBalancesRefresh } from '../queues/itemQueue.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchActiveItemsByUserId(userId)
        return res.send(items)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to get items')
    }
}

export const updateActiveItemsWebhook = async (req: Request, res: Response) => {
    logger.debug('updating webhook for active items')

    const url: string | undefined = req.body.url
    if (url === undefined) throw new HttpError('missing url', 400)

    try {
        const items = await fetchActiveItems()
        await Promise.all(
            items.map(async (item) => await plaidWebhookUpdate(item, url))
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update webhook')
    }
}

export const refreshItem = async (req: Request, res: Response) => {
    logger.debug('refreshing item transactions')

    const itemId: string | undefined = req.params['itemId']
    if (itemId === undefined) throw new HttpError('missing item id', 400)

    const item = await fetchActiveItemByPlaidId(itemId)
    if (!item) throw new HttpError('item not found', 404)

    try {
        await refreshItemTransactions(item)
        await queueItemBalancesRefresh(item)
        return res.status(202).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to refresh item transactions')
    }
}

export const refreshItemTransactions = async (item: Item) => {
    if (item.lastRefreshed) {
        if (
            Date.now() - new Date(item.lastRefreshed).getTime() <
            refreshCooldown
        ) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }
    await plaidTransactionsRefresh(item)
    await modifyItemLastRefreshedByPlaidId(item.plaidId, new Date())
}

export const refreshItemBalances = async (item: Item) => {
    if (item.lastRefreshed) {
        if (
            Date.now() - new Date(item.lastRefreshed).getTime() <
            refreshCooldown
        ) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }
    const accounts = await plaidAccountsBalanceGet(item)
    await insertAccounts(accounts)
    await modifyItemLastRefreshedByPlaidId(item.plaidId, new Date())
}

export const deactivateItem = async (req: Request, res: Response) => {
    logger.debug('deactivating item')

    const itemId: string | undefined = req.params['itemId']
    if (itemId === undefined) throw new HttpError('missing item id', 400)

    try {
        const item = await fetchActiveItemByPlaidId(itemId)
        if (!item) throw new HttpError('item not found', 404)

        await plaidItemRemove(item)
        await modifyItemActiveById(item.id, false)
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to deactivate item')
    }
}

export const syncItemData = async (item: Item) => {
    logger.debug({ item }, 'syncing item data')

    const accounts = await plaidAccountsGet(item)
    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        const addedAccounts = await insertAccounts(accounts)
        if (!addedAccounts) throw Error('accounts not added')

        const { added, modified, removed, cursor } =
            await plaidTransactionsSync(item)

        added.concat(modified)
        if (added.length > 0) {
            logger.debug('inserting transactions')
            const existingTransactions = (
                await fetchActiveTransactionsByUserId(item.userId)
            ).transactions
            const addTransactions = added.map((t) => {
                const account = addedAccounts.find(
                    (a) => a.plaidId === t.account_id
                )
                if (!account) throw Error('account not found')
                return mapPlaidTransaction(t, account.id, existingTransactions)
            })
            const addedTransactions = await insertTransactions(addTransactions)
            if (!addedTransactions) throw Error('transactions not added')
        }

        if (removed.length > 0) {
            logger.debug('removing transactions')
            const removeIds = removed.map((t) => t.transaction_id)
            const removedTransactions =
                await removeTransactionsByPlaidIds(removeIds)
            if (!removedTransactions) throw Error('transactions not removed')
        }

        logger.debug('updating cursor')
        await modifyItemDataByPlaidId(item.plaidId, cursor, new Date())
    } else {
        logger.debug('no accounts. skipping transaction updates')
    }
}
