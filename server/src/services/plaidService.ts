import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
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
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum,
    SandboxPublicTokenCreateRequest,
    TransactionsSyncRequest,
} from 'plaid'
import { env } from 'process'
import { Account, createOrUpdateAccounts } from '../models/account.js'
import {
    createItem,
    Item,
    retrieveItemById,
    updateItemCursor,
} from '../models/item.js'
import { PlaidApiRequest } from '../models/plaid.js'
import {
    createOrUpdateTransactions,
    deleteTransactions,
    Transaction,
} from '../models/transaction.js'
import { User } from '../models/user.js'
import { safeStringify } from '../utils/format.js'
import { logger } from '../utils/logger.js'
import { addItemSyncToQueue } from '../utils/queues/itemSyncQueue.js'
import { addPlaidApiRequestLogToQueue } from '../utils/queues/logQueue.js'

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
logger.debug({ config }, 'configured plaid client')

const callPlaidClientMethod = async <T extends object, P extends object>(
    method: (params: P) => Promise<T>,
    params: P,
    userId?: number,
    itemId?: number
) => {
    const req: PlaidApiRequest = {
        id: -1,
        timestamp: new Date(),
        duration: -1,
        userId: userId ?? null,
        itemId: itemId ?? null,
        method: method.name,
        params,
    }

    try {
        const resp: T = await method.bind(client)(params)
        req.duration = Date.now() - req.timestamp.getTime()

        const sanitized = JSON.parse(safeStringify(resp)) as {
            request?: object
        }
        delete sanitized['request']
        req.response = sanitized

        await addPlaidApiRequestLogToQueue(req)
        return resp
    } catch (error) {
        req.duration = Date.now() - req.timestamp.getTime()

        logger.error({ error }, `plaid client error - ${method.name}`)
        if (error instanceof Error) {
            req.errorName = error.name
            req.errorMessage = error.message
            req.errorStack = error.stack ?? null
        } else {
            req.errorName = 'unknown'
        }

        await addPlaidApiRequestLogToQueue(req)
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
            days_requested: 365, // max - 730
        },
        access_token: accessToken,
        webhook: env['PLAID_WEBHOOK_URL'] ?? '',
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

export const queueItemSync = async (item: Item) => {
    await addItemSyncToQueue(item)
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

export const fireWebhook = async (
    item: Item,
    code: SandboxItemFireWebhookRequestWebhookCodeEnum
) => {
    logger.debug('firing webhook')
    const params: SandboxItemFireWebhookRequest = {
        access_token: item.accessToken,
        webhook_code: code,
    }
    await callPlaidClientMethod(
        client.sandboxItemFireWebhook,
        params,
        item.userId,
        item.id
    )
}

export const createPublicToken = async (user: User, institutionId: string) => {
    logger.debug('creating public token')

    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)

    const year = lastYear.getFullYear()
    const month = String(lastYear.getMonth() + 1).padStart(2, '0')
    const day = String(lastYear.getDate()).padStart(2, '0')
    const startDate = `${year}-${month}-${day}`

    const params: SandboxPublicTokenCreateRequest = {
        institution_id: institutionId,
        initial_products: [PlaidProducts.Transactions],
        options: {
            webhook: env['PLAID_WEBHOOK_URL'] ?? '',
            transactions: {
                start_date: startDate,
            },
        },
    }
    const resp = await callPlaidClientMethod(
        client.sandboxPublicTokenCreate,
        params,
        user.id
    )
    return resp.data.public_token
}

export const exchangePublicTokenAndCreateItemAndSync = async (
    userId: number,
    institutionId: string,
    institutionName: string,
    publicToken: string
) => {
    const resp = await exchangePublicTokenForAccessToken(publicToken, userId)
    const item = await createItem(
        userId,
        resp.itemId,
        resp.accessToken,
        institutionId,
        institutionName
    )
    if (!item) throw Error('item not created')
    await queueItemSync(item)
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
        date: new Date(transaction.authorized_date ?? transaction.date),
        pending: transaction.pending,
    }
}

export const verifyWebhook = async (
    token: string,
    body: string
): Promise<void> => {
    const decodedTokenHeader = jwtDecode(token, { header: true })
    if (
        !decodedTokenHeader.kid ||
        !decodedTokenHeader.alg ||
        !decodedTokenHeader.typ
    ) {
        throw Error('invalid jwt header')
    }
    if (decodedTokenHeader.alg !== 'ES256') {
        throw Error('invalid algorithm')
    }
    if (decodedTokenHeader.typ !== 'JWT') {
        throw Error('invalid type')
    }

    const params = { key_id: decodedTokenHeader.kid }
    const resp = await callPlaidClientMethod(
        client.webhookVerificationKeyGet,
        params
    )
    const plaidJwk = resp.data.key

    const joseJwk: JWK = {
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
        throw Error('body hash does not match')
    }
}
