import {
    AccountsGetRequest,
    ItemRemoveRequest,
    ItemWebhookUpdateRequest,
    SandboxItemResetLoginRequest,
} from 'plaid'
import { insertAccounts } from '../database/accountQueries.js'
import {
    modifyItemCursorByItemId,
    modifyItemLastSyncedByItemId,
} from '../database/itemQueries.js'
import {
    insertTransactions,
    removeTransactionsByTransactionIds,
} from '../database/transactionQueries.js'
import { Item } from '../models/item.js'
import { logger } from '../utils/logger.js'
import { mapPlaidAccount } from './accountMethods.js'
import { executePlaidMethod, plaidClient } from './index.js'
import {
    mapPlaidTransaction,
    plaidRetrieveTransactionUpdates,
} from './transactionMethods.js'

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
        await modifyItemLastSyncedByItemId(item.itemId, new Date())
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

export const plaidResetItemLogin = async (item: Item) => {
    logger.debug({ item }, 'resetting item login')
    const params: SandboxItemResetLoginRequest = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        plaidClient.sandboxItemResetLogin,
        params,
        item.userId,
        item.id
    )
    return resp.data.reset_login
}

export const plaidUpdateItemWebhook = async (item: Item, webhook: string) => {
    logger.debug({ item }, 'updating webhook')
    const params: ItemWebhookUpdateRequest = {
        access_token: item.accessToken,
        webhook,
    }
    await executePlaidMethod(
        plaidClient.itemWebhookUpdate,
        params,
        item.userId,
        item.id
    )
}
