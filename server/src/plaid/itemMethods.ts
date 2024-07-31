import {
    AccountBase,
    AccountsGetRequest,
    ItemRemoveRequest,
    Transaction as PlaidTransaction,
} from 'plaid'
import { insertAccounts } from '../database/accountQueries.js'
import { modifyItemCursorByItemId } from '../database/itemQueries.js'
import {
    insertTransactions,
    removeTransactionsByTransactionIds,
} from '../database/transactionQueries.js'
import { Account } from '../models/account.js'
import { Item } from '../models/item.js'
import { Transaction } from '../models/transaction.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'
import { plaidRetrieveTransactionUpdates } from './transactionMethods.js'

export const plaidSyncItemData = async (item: Item) => {
    logger.debug({ item }, 'syncing item data')

    logger.debug('updating accounts')
    const params: AccountsGetRequest = { access_token: item.accessToken }
    const resp = await executePlaidMethod(
        plaidClient.accountsGet,
        params,
        item.userId,
        item.id
    )

    const plaidAccounts = resp.data.accounts
    if (plaidAccounts.length) {
        const accounts = await insertAccounts(
            plaidAccounts.map((acc) => mapPlaidAccount(acc, item.id))
        )
        if (!accounts) throw Error('accounts not created')

        logger.debug('updating transactions')
        const { added, modified, removed, cursor } =
            await plaidRetrieveTransactionUpdates(item)
        added.concat(modified)

        if (added.length) {
            const transactions = await insertTransactions(
                added.map((t) => {
                    const id = accounts.find(
                        (acc) => acc.accountId === t.account_id
                    )?.id
                    if (!id) throw Error('transaction has no matching account')
                    return mapPlaidTransaction(t, id)
                })
            )
            if (!transactions) throw Error('transactions not created')
        }

        if (removed.length) {
            const transactions = await removeTransactionsByTransactionIds(
                removed.map((t) => t.transaction_id)
            )
            if (!transactions) throw Error('transactions not removed')
        }

        logger.debug('updating cursor')
        await modifyItemCursorByItemId(item.itemId, cursor)
    } else {
        logger.debug('no accounts found. skipping transaction updates')
    }
}

export const plaidUnlinkItem = async (item: Item) => {
    logger.debug({ item }, 'removing item')
    const params: ItemRemoveRequest = { access_token: item.accessToken }
    await executePlaidMethod(
        plaidClient.itemRemove,
        params,
        item.userId,
        item.id
    )
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

export const mapPlaidTransaction = (
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
