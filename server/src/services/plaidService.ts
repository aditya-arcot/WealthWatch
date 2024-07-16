import {
    AccountBase,
    Configuration,
    CountryCode,
    LinkTokenCreateRequest,
    PlaidApi,
    PlaidEnvironments,
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    Products,
    TransactionsSyncResponse,
} from 'plaid'
import { env } from 'process'
import { Account, createOrUpdateAccounts } from '../models/account.js'
import {
    AccessToken,
    Item,
    LinkToken,
    retrieveItemById,
    retrieveItemByUserIdAndInstitutionId,
    updateItemCursor,
} from '../models/plaid.js'
import {
    createOrUpdateTransactions,
    deleteTransactions,
    Transaction,
} from '../models/transaction.js'
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

export const createLinkToken = async (
    userId: number,
    itemId?: string
): Promise<LinkToken> => {
    let accessToken = null
    // balance product automatically included
    let products = [Products.Transactions]
    let requiredIfSupportedProducts = [
        Products.Investments,
        Products.Liabilities,
    ]

    // link update mode
    if (itemId) {
        const item = await retrieveItemById(itemId)
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

    const resp = await client.linkTokenCreate(params)
    logger.debug({ resp }, 'received plaid link token create response')

    return {
        expiration: resp.data.expiration,
        linkToken: resp.data.link_token,
        requestId: resp.data.request_id,
    }
}

export const checkExistingItem = async (
    userId: number,
    institutionId: string
): Promise<boolean> => {
    return !!(await retrieveItemByUserIdAndInstitutionId(userId, institutionId))
}

export const exchangePublicTokenForAccessToken = async (
    publicToken: string
): Promise<AccessToken> => {
    const resp = await client.itemPublicTokenExchange({
        public_token: publicToken,
    })
    logger.debug({ resp }, 'received plaid public token exchange response')
    return {
        accessToken: resp.data.access_token,
        itemId: resp.data.item_id,
        requestId: resp.data.request_id,
    }
}

export const syncItemData = async (item: Item) => {
    logger.debug({ item }, 'syncing item data')

    logger.debug('updating accounts')
    const resp = await client.accountsGet({ access_token: item.accessToken })
    logger.debug({ resp }, 'received plaid accounts get response')
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
            let data: TransactionsSyncResponse
            if (cursor) {
                const resp = await client.transactionsSync({
                    access_token: item.accessToken,
                    cursor,
                })
                logger.debug(
                    { resp },
                    'received plaid transactions sync response'
                )
                data = resp.data
            } else {
                const resp = await client.transactionsSync({
                    access_token: item.accessToken,
                })
                logger.debug(
                    { resp },
                    'received plaid transactions sync response'
                )
                data = resp.data
            }

            added = added.concat(data.added)
            modified = modified.concat(data.modified)
            removed = removed.concat(data.removed)
            hasMore = data.has_more
            cursor = data.next_cursor
        }
        return { added, modified, removed, cursor }
    } catch (error) {
        logger.error(error)
        throw Error('failed to retrieve transaction updates')
    }
}

export const removeItem = async (item: Item) => {
    logger.debug('removing item')
    const resp = await client.itemRemove({ access_token: item.accessToken })
    logger.debug({ resp }, 'received plaid item remove response')
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
