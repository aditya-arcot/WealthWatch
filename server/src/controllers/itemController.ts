import { Account, Item, itemInCooldown } from '@wealthwatch-shared'
import { Request, Response } from 'express'
import {
    fetchActiveAccountsByUserId,
    insertAccounts,
    modifyAccountsToInactiveByPlaidItemId,
} from '../database/accountQueries.js'
import { insertHoldings } from '../database/holdingQueries.js'
import {
    fetchActiveItemByPlaidId,
    fetchActiveItemsWithAccountsByUserId,
    fetchActiveItemsWithAccountsWithHoldingsByUserId,
    fetchActiveItemsWithCreditCardAccounts,
    fetchActiveItemsWithMortgageAccounts,
    fetchActiveItemsWithStudentsLoansAccounts,
    modifyItemCursorByPlaidId,
    modifyItemInvestmentsLastRefreshedByPlaidId,
    modifyItemLastRefreshedByPlaidId,
    modifyItemToInactiveById,
    modifyItemTransactionsLastRefreshedByPlaidId,
} from '../database/itemQueries.js'
import {
    insertCreditCards,
    insertMortgages,
    insertStudentLoans,
} from '../database/liabilityQueries.js'
import { modifyNotificationsToInactiveByItemId } from '../database/notificationQueries.js'
import {
    fetchSecurities,
    insertSecurities,
} from '../database/securityQueries.js'
import {
    fetchPaginatedActiveTransactionsAndCountsByUserIdAndFilters,
    insertTransactions,
    removeTransactionsByPlaidIds,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
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
    mapPlaidCreditCard,
    mapPlaidMortgage,
    mapPlaidStudentLoan,
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
import { logger } from '../utilities/logger.js'

export const getUserItemsWithAccounts = async (req: Request, res: Response) => {
    logger.debug('getting items with accounts')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithAccountsByUserId(userId)
    return res.json(items)
}

export const getUserItemsWithAccountsWithHoldings = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting items with accounts with holdings')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithAccountsWithHoldingsByUserId(userId)
    return res.json(items)
}

export const getUserItemsWithCreditCardAccounts = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting items with credit card accounts')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithCreditCardAccounts(userId)
    return res.json(items)
}

export const getUserItemsWithMortgageAccounts = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting items with mortgage accounts')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithMortgageAccounts(userId)
    return res.json(items)
}

export const getUserItemsWithStudentLoanAccounts = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting items with student loan accounts')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithStudentsLoansAccounts(userId)
    return res.json(items)
}

export const refreshItem = async (req: Request, res: Response) => {
    logger.debug('refreshing item')

    const plaidItemId = req.params['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    if (itemInCooldown(item.lastRefreshed)) {
        logger.debug(
            { id: item.id, lastRefreshed: item.lastRefreshed },
            'item refresh cooldown'
        )
        throw new HttpError('item refresh cooldown', 429)
    }

    if (await refreshItemTransactions(item)) {
        await modifyItemTransactionsLastRefreshedByPlaidId(
            item.plaidId,
            new Date()
        )
    }

    if (await refreshItemInvestments(item)) {
        await modifyItemInvestmentsLastRefreshedByPlaidId(
            item.plaidId,
            new Date()
        )
    }

    await queueSyncItemBalances(item)
    await modifyItemLastRefreshedByPlaidId(item.plaidId, new Date())

    return res.status(202).send()
}

export const deactivateItem = async (req: Request, res: Response) => {
    logger.debug('deactivating item')

    const plaidItemId = req.params['plaidItemId']
    if (typeof plaidItemId !== 'string')
        throw new HttpError('missing or invalid Plaid item id', 400)

    const item = await fetchActiveItemByPlaidId(plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await removeDeactivateItem(item)

    return res.status(204).send()
}

export const refreshItemTransactions = (
    item: Item,
    checkCooldown = true
): Promise<boolean> => {
    if (checkCooldown && itemInCooldown(item.transactionsLastRefreshed)) {
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
    if (checkCooldown && itemInCooldown(item.investmentsLastRefreshed)) {
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
    await modifyAccountsToInactiveByPlaidItemId(item.plaidId)

    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        await insertAccounts(accounts, updateBalances)
    } else {
        logger.debug('no accounts to insert')
    }
}

export const syncItemTransactions = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item transactions')

    const accounts = await fetchActiveAccountsByUserId(item.userId)
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
                await fetchPaginatedActiveTransactionsAndCountsByUserIdAndFilters(
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
            await removeTransactionsByPlaidIds(removeIds)
        }

        logger.debug('updating cursor')
        await modifyItemCursorByPlaidId(item.plaidId, cursor)
    } else {
        logger.debug('no accounts. skipping transaction updates')
    }
}

export const syncItemInvestments = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item investments')

    const accounts = await fetchActiveAccountsByUserId(item.userId)
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

    const accounts = await fetchActiveAccountsByUserId(item.userId)
    if (accounts.length > 0) {
        const { credit, mortgage, student } = await plaidLiabilitiesGet(item)

        if (credit && credit.length > 0) {
            logger.debug('inserting credit cards')
            const addCreditCards = credit.map((c) => {
                const account = accounts.find((a) => a.plaidId === c.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidCreditCard(c, account.id)
            })
            await insertCreditCards(addCreditCards)
        } else {
            logger.debug('no credit cards. skipping')
        }

        if (mortgage && mortgage.length > 0) {
            logger.debug('inserting mortgages')
            const addMortgages = mortgage.map((m) => {
                const account = accounts.find((a) => a.plaidId === m.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidMortgage(m, account.id)
            })
            await insertMortgages(addMortgages)
        } else {
            logger.debug('no mortgages. skipping')
        }

        if (student && student.length > 0) {
            logger.debug('inserting student loans')
            const addStudentLoans = student.map((s) => {
                const account = accounts.find((a) => a.plaidId === s.account_id)
                if (!account) throw new HttpError('account not found', 404)
                return mapPlaidStudentLoan(s, account.id)
            })
            await insertStudentLoans(addStudentLoans)
        } else {
            logger.debug('no student loans. skipping')
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

export const removeDeactivateItem = async (item: Item) => {
    logger.debug({ id: item.id }, 'removing & deactivating item')
    await plaidItemRemove(item)
    await modifyItemToInactiveById(item.id)
    await modifyNotificationsToInactiveByItemId(item.id)
}
