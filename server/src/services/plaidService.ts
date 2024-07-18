import {
    AccountBase,
    AccountsGetRequest,
    Configuration,
    CountryCode,
    ItemPublicTokenExchangeRequest,
    ItemRemoveRequest,
    LinkTokenCreateRequest,
    PlaidApi,
    PlaidEnvironments,
    Products as PlaidProducts,
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionsSyncRequest,
} from 'plaid'
import { env } from 'process'
import { Account, createOrUpdateAccounts } from '../models/account.js'
import { Item, retrieveItemById, updateItemCursor } from '../models/item.js'
import { createPlaidApiRequest, PlaidApiRequest } from '../models/plaid.js'
import {
    createOrUpdateTransactions,
    deleteTransactions,
    Transaction,
} from '../models/transaction.js'
import { safeStringify } from '../utils/format.js'
import { logger } from '../utils/logger.js'

if (!env['PLAID_ENV'] || !env['PLAID_CLIENT_ID'] || !env['PLAID_SECRET']) {
    throw Error('missing one or more plaid secrets')
}
const config = new Configuration({
    basePath: PlaidEnvironments[env['PLAID_ENV']]!,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': env['PLAID_CLIENT_ID'],
            'PLAID-SECRET': env['PLAID_SECRET'],
        },
    },
})
const client = new PlaidApi(config)
logger.debug(config, 'configured plaid client')

const callPlaidClientMethod = async <T extends object, P extends object>(
    method: (params: P) => Promise<T>,
    params: P,
    userId: number,
    itemId?: number
) => {
    const req: PlaidApiRequest = {
        id: -1,
        userId,
        itemId: itemId ?? null,
        method: method.name,
        params,
    }

    try {
        const resp: T = await method.bind(client)(params)
        const sanitized = JSON.parse(safeStringify(resp)) as {
            request?: object
        }
        delete sanitized['request']
        req.response = sanitized
        createPlaidApiRequest(req)
        return resp
    } catch (error) {
        logger.error({ error }, `plaid client error - ${method.name}`)
        if (error instanceof Error) {
            req.errorName = error.name
            req.errorMessage = error.message
            req.errorStack = error.stack ?? null
        } else {
            req.errorName = 'unknown'
        }
        createPlaidApiRequest(req)
        throw error
    }
}

export const createLinkToken = async (
    userId: number,
    itemId?: string
): Promise<string> => {
    let accessToken = null
    // balance product automatically included
    let products = [PlaidProducts.Transactions]
    let requiredIfSupportedProducts = [
        PlaidProducts.Investments,
        PlaidProducts.Liabilities,
    ]

    let item: Item | null = null
    // link update mode
    if (itemId) {
        item = await retrieveItemById(itemId)
        if (!item) throw Error('item not found')
        accessToken = item.accessToken
        products = []
        requiredIfSupportedProducts = []
    }

    const params: LinkTokenCreateRequest = {
        user: {
            client_user_id: userId.toString(),
        },
        client_name: 'WealthWatch',
        language: 'en',
        country_codes: [CountryCode.Us],
        products,
        required_if_supported_products: requiredIfSupportedProducts,
        transactions: {
            days_requested: 365,
        },
        access_token: accessToken,
    }

    const resp = await callPlaidClientMethod(
        client.linkTokenCreate,
        params,
        userId,
        item?.id
    )
    return resp.data.link_token
}

export const exchangePublicTokenForAccessToken = async (
    publicToken: string,
    userId: number
) => {
    const params: ItemPublicTokenExchangeRequest = { public_token: publicToken }
    const resp = await callPlaidClientMethod(
        client.itemPublicTokenExchange,
        params,
        userId
    )

    return {
        accessToken: resp.data.access_token,
        itemId: resp.data.item_id,
    }
}

export const syncItemData = async (item: Item) => {
    logger.debug({ item }, 'syncing item data')

    logger.debug('updating accounts')
    const params: AccountsGetRequest = { access_token: item.accessToken }
    const resp = await callPlaidClientMethod(
        client.accountsGet,
        params,
        item.userId,
        item.id
    )

    const plaidAccounts = resp.data.accounts
    const accounts = await createOrUpdateAccounts(
        plaidAccounts.map((acc) => mapPlaidAccount(acc, item.id))
    )
    if (!accounts) throw Error('accounts not created')

    logger.debug('updating transactions')
    const { added, modified, removed, cursor } =
        await retrieveTransactionUpdates(item)
    added.concat(modified)
    await createOrUpdateTransactions(
        added.map((t) => {
            const id = accounts.find(
                (acc) => acc.accountId === t.account_id
            )?.id
            if (!id) throw Error('transaction has no matching account')
            return mapPlaidTransaction(t, id)
        })
    )
    await deleteTransactions(removed.map((t) => t.transaction_id))

    logger.debug('updating cursor')
    await updateItemCursor(item.itemId, cursor)
}

const retrieveTransactionUpdates = async (item: Item) => {
    logger.debug('retrieving transaction updates')

    let cursor = item.cursor
    let added: Array<PlaidTransaction> = []
    let modified: Array<PlaidTransaction> = []
    let removed: Array<PlaidRemovedTransaction> = []
    let hasMore = true

    try {
        while (hasMore) {
            let params: TransactionsSyncRequest
            if (cursor) {
                params = {
                    access_token: item.accessToken,
                    cursor,
                }
            } else {
                params = {
                    access_token: item.accessToken,
                }
            }
            const resp = await callPlaidClientMethod(
                client.transactionsSync,
                params,
                item.userId,
                item.id
            )

            added = added.concat(resp.data.added)
            modified = modified.concat(resp.data.modified)
            removed = removed.concat(resp.data.removed)
            hasMore = resp.data.has_more
            cursor = resp.data.next_cursor
        }
        return { added, modified, removed, cursor }
    } catch (error) {
        logger.error(error)
        throw Error('failed to retrieve transaction updates')
    }
}

export const removeItem = async (item: Item) => {
    logger.debug('removing item')
    const params: ItemRemoveRequest = { access_token: item.accessToken }
    await callPlaidClientMethod(client.itemRemove, params, item.userId, item.id)
}

const mapPlaidAccount = (account: AccountBase, itemId: number): Account => {
    return {
        id: 0,
        itemId,
        accountId: account.account_id,
        name: account.name,
        mask: account.mask,
        officialName: account.official_name,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        isoCurrencyCode: account.balances.iso_currency_code,
        unofficialCurrencyCode: account.balances.unofficial_currency_code,
        creditLimit: account.balances.limit,
        type: account.type,
        subtype: account.subtype,
    }
}

const mapPlaidTransaction = (
    transaction: PlaidTransaction,
    accountId: number
): Transaction => {
    return {
        id: 0,
        accountId,
        transactionId: transaction.transaction_id,
        name: transaction.name,
        amount: transaction.amount,
        merchant: transaction.merchant_name ?? null,
        merchantId: transaction.merchant_entity_id ?? null,
        category: transaction.personal_finance_category?.primary ?? null,
        detailedCategory:
            transaction.personal_finance_category?.detailed ?? null,
        paymentChannel: transaction.payment_channel,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        date: new Date(transaction.date),
        pending: transaction.pending,
    }
}
