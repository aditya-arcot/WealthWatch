import {
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionsSyncRequest,
} from 'plaid'
import { Item } from '../models/item.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidRetrieveTransactionUpdates = async (item: Item) => {
    logger.debug({ item }, 'retrieving transaction updates')

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
            const resp = await executePlaidMethod(
                plaidClient.transactionsSync,
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
