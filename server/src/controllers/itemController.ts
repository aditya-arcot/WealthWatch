import { Request, Response } from 'express'
import { insertAccounts } from '../database/accountQueries.js'
import { insertHoldings } from '../database/holdingQueries.js'
import {
    fetchActiveItems,
    fetchActiveItemsWithUserId,
    fetchActiveItemWithPlaidId,
    modifyItemActiveWithId,
    modifyItemCursorWithPlaidId,
    modifyItemLastRefreshedWithPlaidId,
    modifyItemTransactionsLastRefreshedWithPlaidId,
} from '../database/itemQueries.js'
import {
    fetchSecurities,
    insertSecurities,
} from '../database/securityQueries.js'
import {
    fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters,
    insertTransactions,
    removeTransactionsWithPlaidIds,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
import { inCooldown, Item } from '../models/item.js'
import {
    plaidAccountsBalanceGet,
    plaidAccountsGet,
} from '../plaid/accountMethods.js'
import {
    mapPlaidHolding,
    mapPlaidSecurity,
    plaidInvestmentsHoldingsGet,
} from '../plaid/investmentMethods.js'
import { plaidItemRemove, plaidWebhookUpdate } from '../plaid/itemMethods.js'
import {
    mapPlaidTransaction,
    plaidTransactionsRefresh,
    plaidTransactionsSync,
} from '../plaid/transactionMethods.js'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
} from '../queues/itemQueue.js'
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

    if (inCooldown(item.lastRefreshed)) {
        logger.debug(
            { id: item.id, lastRefreshed: item.lastRefreshed },
            'item refresh cooldown'
        )
        throw new HttpError('item refresh cooldown', 429)
    }

    if (inCooldown(item.transactionsLastRefreshed)) {
        logger.debug(
            {
                id: item.id,
                transactionsLastRefreshed: item.transactionsLastRefreshed,
            },
            'transactions refresh cooldown. skipping'
        )
    } else {
        await refreshItemTransactions(item)
        await modifyItemTransactionsLastRefreshedWithPlaidId(
            item.plaidId,
            new Date()
        )
    }

    await queueSyncItemBalances(item)
    await queueSyncItemInvestments(item)
    await modifyItemLastRefreshedWithPlaidId(item.plaidId, new Date())

    return res.status(202).send()
}

export const refreshItemTransactions = async (item: Item) => {
    logger.debug({ id: item.id }, 'refreshing item transactions')
    await plaidTransactionsRefresh(item)
}

export const syncItemTransactions = async (item: Item) => {
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
        await modifyItemCursorWithPlaidId(item.plaidId, cursor)
    } else {
        logger.debug('no accounts. skipping transaction updates')
    }
}

export const syncItemBalances = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item balances')
    const accounts = await plaidAccountsBalanceGet(item)
    await insertAccounts(accounts, true)
}

export const syncItemInvestments = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item investments')

    const accounts = await plaidAccountsGet(item)
    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        const addedAccounts = await insertAccounts(accounts)
        if (!addedAccounts) throw new HttpError('failed to insert accounts')

        const { holdings, securities } = await plaidInvestmentsHoldingsGet(item)

        if (securities.length > 0) {
            logger.debug('inserting investment securities')
            const addSecurities = securities.map(mapPlaidSecurity)
            const addedSecurities = await insertSecurities(addSecurities)
            if (!addedSecurities)
                throw new HttpError('failed to insert securities')
        }

        if (holdings.length > 0) {
            logger.debug('inserting investment holdings')
            const existingSecurities = await fetchSecurities()
            const addHoldings = holdings.map((holding) => {
                const account = addedAccounts.find(
                    (a) => a.plaidId === holding.account_id
                )
                if (!account) throw new HttpError('account not found', 404)

                const security = existingSecurities.find(
                    (s) => s.plaidId === holding.security_id
                )
                if (!security) throw new HttpError('security not found', 404)

                return mapPlaidHolding(holding, account.id, security.id)
            })
            const addedHoldings = await insertHoldings(addHoldings)
            if (!addedHoldings) throw new HttpError('failed to insert holdings')
        }
    } else {
        logger.debug('no accounts. skipping investment updates')
    }
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
