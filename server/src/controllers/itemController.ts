import { Request, Response } from 'express'
import {
    fetchActiveAccountsWithUserId,
    insertAccounts,
    modifyAccountsActiveWithPlaidItemId,
} from '../database/accountQueries.js'
import { insertHoldings } from '../database/holdingQueries.js'
import {
    fetchActiveItemsWithUserId,
    fetchActiveItemWithPlaidId,
    modifyItemActiveWithId,
    modifyItemCursorWithPlaidId,
    modifyItemInvestmentsLastRefreshedWithPlaidId,
    modifyItemLastRefreshedWithPlaidId,
    modifyItemTransactionsLastRefreshedWithPlaidId,
} from '../database/itemQueries.js'
import {
    insertCreditCardLiabilities,
    insertMortgageLiabilities,
    insertStudentLoanLiabilities,
} from '../database/liabilityQueries.js'
import { modifyNotificationsToInactiveWithItemId } from '../database/notificationQueries.js'
import {
    fetchSecurities,
    insertSecurities,
} from '../database/securityQueries.js'
import {
    fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters,
    insertTransactions,
    removeTransactionsWithPlaidIds,
} from '../database/transactionQueries.js'
import { Account } from '../models/account.js'
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
    plaidInvestmentsRefresh,
} from '../plaid/investmentMethods.js'
import { plaidItemRemove } from '../plaid/itemMethods.js'
import {
    mapPlaidCreditCardLiability,
    mapPlaidMortgageLiability,
    mapPlaidStudentLoanLiability,
    plaidLiabilitiesGet,
} from '../plaid/liabilityMethods.js'
import {
    mapPlaidTransaction,
    plaidTransactionsRefresh,
    plaidTransactionsSync,
} from '../plaid/transactionMethods.js'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
    queueSyncItemLiabilities,
    queueSyncItemTransactions,
} from '../queues/itemQueue.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    return res.json(items)
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

    if (await refreshItemTransactions(item)) {
        await modifyItemTransactionsLastRefreshedWithPlaidId(
            item.plaidId,
            new Date()
        )
    }

    if (await refreshItemInvestments(item)) {
        await modifyItemInvestmentsLastRefreshedWithPlaidId(
            item.plaidId,
            new Date()
        )
    }

    await queueSyncItemBalances(item)
    await modifyItemLastRefreshedWithPlaidId(item.plaidId, new Date())

    return res.status(202).send()
}

export const refreshItemTransactions = (
    item: Item,
    checkCooldown = true
): Promise<boolean> => {
    if (checkCooldown && inCooldown(item.transactionsLastRefreshed)) {
        logger.debug(
            {
                id: item.id,
                transactionsLastRefreshed: item.transactionsLastRefreshed,
            },
            'transactions refresh cooldown. skipping'
        )
        return Promise.resolve(false)
    }
    return plaidTransactionsRefresh(item)
}

export const refreshItemInvestments = (
    item: Item,
    checkCooldown = true
): Promise<boolean> => {
    if (checkCooldown && inCooldown(item.investmentsLastRefreshed)) {
        logger.debug(
            {
                id: item.id,
                investmentsLastRefreshed: item.investmentsLastRefreshed,
            },
            'investments refresh cooldown. skipping'
        )
        return Promise.resolve(false)
    }
    return plaidInvestmentsRefresh(item)
}

export const syncItemData = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item data')
    await syncItemAccounts(item)
    await queueSyncItemTransactions(item)
    await queueSyncItemInvestments(item)
    await queueSyncItemLiabilities(item)
    await queueSyncItemBalances(item)
}

export const syncItemAccounts = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item accounts')
    const accounts = await plaidAccountsGet(item)
    await mergeItemAccounts(item, accounts)
}

const mergeItemAccounts = async (
    item: Item,
    accounts: Account[],
    updateBalances = false
) => {
    logger.debug({ id: item.id }, 'merging item accounts')

    logger.debug('deactivating existing accounts')
    await modifyAccountsActiveWithPlaidItemId(item.plaidId, false)

    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        await insertAccounts(accounts, updateBalances)
    } else {
        logger.debug('no accounts to insert')
    }
}

export const syncItemTransactions = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item transactions')

    const accounts = await fetchActiveAccountsWithUserId(item.userId)
    if (accounts.length > 0) {
        const resp = await plaidTransactionsSync(item)
        if (!resp) {
            logger.debug('skipping transactions sync')
            return
        }
        const { added, modified, removed, cursor } = resp

        added.concat(modified)
        if (added.length > 0) {
            logger.debug('inserting transactions')
            const existingTransactions = (
                await fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters(
                    item.userId
                )
            ).transactions
            const addTransactions = added.map((t) => {
                const account = accounts.find((a) => a.plaidId === t.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidTransaction(t, account.id, existingTransactions)
            })
            await insertTransactions(addTransactions)
        }

        if (removed.length > 0) {
            logger.debug('removing transactions')
            const removeIds = removed.map((t) => t.transaction_id)
            await removeTransactionsWithPlaidIds(removeIds)
        }

        logger.debug('updating cursor')
        await modifyItemCursorWithPlaidId(item.plaidId, cursor)
    } else {
        logger.debug('no accounts. skipping transaction updates')
    }
}

export const syncItemInvestments = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item investments')

    const accounts = await fetchActiveAccountsWithUserId(item.userId)
    if (accounts.length > 0) {
        const resp = await plaidInvestmentsHoldingsGet(item)
        if (!resp) {
            logger.debug('skipping investments sync')
            return
        }
        const { holdings, securities } = resp

        if (securities.length > 0) {
            logger.debug('inserting investment securities')
            const addSecurities = securities.map(mapPlaidSecurity)
            await insertSecurities(addSecurities)
        }

        if (holdings.length > 0) {
            logger.debug('inserting investment holdings')
            const existingSecurities = await fetchSecurities()
            const addHoldings = holdings.map((holding) => {
                const account = accounts.find(
                    (a) => a.plaidId === holding.account_id
                )
                if (!account) throw new HttpError('account not found', 404)

                const security = existingSecurities.find(
                    (s) => s.plaidId === holding.security_id
                )
                if (!security) throw new HttpError('security not found', 404)

                return mapPlaidHolding(holding, account.id, security.id)
            })
            await insertHoldings(addHoldings)
        }
    } else {
        logger.debug('no accounts. skipping investment updates')
    }
}

export const syncItemLiabilities = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item liabilities')

    const accounts = await fetchActiveAccountsWithUserId(item.userId)
    if (accounts.length > 0) {
        const { credit, mortgage, student } = await plaidLiabilitiesGet(item)

        if (credit && credit.length > 0) {
            logger.debug('inserting credit card liabilities')
            const addCreditCardLiabilities = credit.map((c) => {
                const account = accounts.find((a) => a.plaidId === c.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidCreditCardLiability(c, account.id)
            })
            await insertCreditCardLiabilities(addCreditCardLiabilities)
        } else {
            logger.debug('no credit card liabilities. skipping')
        }

        if (mortgage && mortgage.length > 0) {
            logger.debug('inserting mortgage liabilities')
            const addMortgageLiabilities = mortgage.map((m) => {
                const account = accounts.find((a) => a.plaidId === m.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidMortgageLiability(m, account.id)
            })
            await insertMortgageLiabilities(addMortgageLiabilities)
        } else {
            logger.debug('no mortgage liabilities. skipping')
        }

        if (student && student.length > 0) {
            logger.debug('inserting student loan liabilities')
            const addStudentLoanLiabilities = student.map((s) => {
                const account = accounts.find((a) => a.plaidId === s.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidStudentLoanLiability(s, account.id)
            })
            await insertStudentLoanLiabilities(addStudentLoanLiabilities)
        } else {
            logger.debug('no student loan liabilities. skipping')
        }
    } else {
        logger.debug('no accounts. skipping liability updates')
    }
}

export const syncItemBalances = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item balances')
    const accounts = await plaidAccountsBalanceGet(item)
    if (accounts) await mergeItemAccounts(item, accounts, true)
}

export const deactivateItem = async (req: Request, res: Response) => {
    logger.debug('deactivating item')

    const plaidItemId = req.params['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemWithPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await removeDeactivateItem(item)

    return res.status(204).send()
}

export const removeDeactivateItem = async (item: Item) => {
    logger.debug({ id: item.id }, 'removing & deactivating item')
    await plaidItemRemove(item)
    await modifyItemActiveWithId(item.id, false)
    await modifyNotificationsToInactiveWithItemId(item.id)
}
