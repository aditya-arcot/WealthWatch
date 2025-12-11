import {
    PlaidDetailedCategoryEnum,
    PlaidGeneralErrorCodeEnum,
    PlaidPrimaryCategoryEnum,
    PlaidTransactionErrorCodeEnum,
} from '@enums'
import { detailedCategoryMap, primaryCategoryMap } from '@maps'
import { PlaidApiError } from '@models'
import { executePlaidMethod, getPlaidClient } from '@plaid'
import { logger } from '@utilities'
import {
    CategoryEnum,
    Item,
    PaymentChannelEnum,
    Transaction,
} from '@wealthwatch-shared'
import {
    Location,
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionPaymentChannelEnum,
    TransactionsRefreshRequest,
    TransactionsSyncRequest,
} from 'plaid'

export const plaidTransactionsRefresh = async (item: Item) => {
    logger.debug({ id: item.id }, 'refreshing item transactions')

    const params: TransactionsRefreshRequest = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        access_token: item.accessToken,
    }

    try {
        await executePlaidMethod(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            getPlaidClient().transactionsRefresh,
            params,
            item.userId,
            item.id
        )
        return true
    } catch (error) {
        if (!(error instanceof PlaidApiError)) throw error
        if (
            (error.code as PlaidGeneralErrorCodeEnum) !==
            PlaidGeneralErrorCodeEnum.ProductsNotSupported
        )
            throw error
        logger.error(error)
        logger.debug(
            { id: item.id },
            'products not supported error. abandoning transactions refresh'
        )
        return false
    }
}

interface PlaidTransactionsSyncResponse {
    added: PlaidTransaction[]
    modified: PlaidTransaction[]
    removed: PlaidRemovedTransaction[]
    cursor: string | null
}

export const plaidTransactionsSync = async (
    item: Item,
    retry = true
): Promise<PlaidTransactionsSyncResponse | undefined> => {
    logger.debug({ id: item.id }, 'retrieving item transactions updates')

    let added: PlaidTransaction[] = []
    let modified: PlaidTransaction[] = []
    let removed: PlaidRemovedTransaction[] = []
    let cursor = item.cursor
    let hasMore = true

    try {
        while (hasMore) {
            const params: TransactionsSyncRequest = {
                /* eslint-disable @typescript-eslint/naming-convention */
                access_token: item.accessToken,
                options: {
                    include_original_description: true,
                },
                /* eslint-enable @typescript-eslint/naming-convention */
            }
            if (cursor !== null) {
                params.cursor = cursor
            }
            const resp = await executePlaidMethod(
                // eslint-disable-next-line @typescript-eslint/unbound-method
                getPlaidClient().transactionsSync,
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
        if (!(error instanceof PlaidApiError)) {
            throw error
        }
        if (
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            (error.code as PlaidTransactionErrorCodeEnum) !==
            PlaidTransactionErrorCodeEnum.TransactionsSyncMutationDuringPagination
        ) {
            throw error
        }
        logger.error(error)

        if (!retry) {
            logger.error(
                { id: item.id },
                'transactions sync mutation error. already retried. abandoning transactions sync'
            )
            throw error
        }
        logger.debug(
            { id: item.id },
            'transactions sync mutation error. retrying transactions sync after 5 seconds'
        )

        await new Promise((resolve) => setTimeout(resolve, 5000))
        return plaidTransactionsSync(item, false)
    }
}

export const mapPlaidTransaction = (
    transaction: PlaidTransaction,
    accountId: number,
    existingTransactions: Transaction[]
): Transaction => {
    let customName = null
    let customCategoryId = null
    let note = null

    const primaryCategory = transaction.personal_finance_category?.primary
    const detailedCategory = transaction.personal_finance_category?.detailed
    const categoryId = mapPlaidTransactionCategory(
        primaryCategory,
        detailedCategory
    )

    const paymentChannel = mapPlaidPaymentChannel(transaction.payment_channel)
    const location = mapPlaidLocation(transaction.location)

    // link previous pending transaction
    const pendingTransaction = existingTransactions.find(
        (t) => t.plaidId === transaction.pending_transaction_id
    )
    if (pendingTransaction) {
        customName = pendingTransaction.customName
        customCategoryId = pendingTransaction.customCategoryId
        note = pendingTransaction.note
    }

    return {
        id: -1,
        accountId,
        plaidId: transaction.transaction_id,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        name: transaction.original_description ?? transaction.name,
        customName,
        amount: transaction.amount,
        primaryCategory: primaryCategory ?? null,
        detailedCategory: detailedCategory ?? null,
        categoryId,
        customCategoryId,
        paymentChannel,
        merchantId: transaction.merchant_entity_id ?? null,
        merchant: transaction.merchant_name ?? null,
        location,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        date: new Date(transaction.authorized_date ?? transaction.date),
        pending: transaction.pending,
        note,
    }
}

const mapPlaidTransactionCategory = (
    primary: string | undefined,
    detailed: string | undefined
): CategoryEnum => {
    const detailedEnum = detailed as PlaidDetailedCategoryEnum
    if (Object.values(PlaidDetailedCategoryEnum).includes(detailedEnum)) {
        return detailedCategoryMap[detailedEnum]
    }

    const primaryEnum = primary as PlaidPrimaryCategoryEnum
    if (Object.values(PlaidPrimaryCategoryEnum).includes(primaryEnum)) {
        return primaryCategoryMap[primaryEnum]
    }

    return CategoryEnum.Uncategorized
}

const mapPlaidPaymentChannel = (
    paymentChannel: TransactionPaymentChannelEnum
): PaymentChannelEnum => {
    switch (paymentChannel) {
        case TransactionPaymentChannelEnum.InStore:
            return PaymentChannelEnum.InStore
        case TransactionPaymentChannelEnum.Online:
            return PaymentChannelEnum.Online
        default:
            return PaymentChannelEnum.Other
    }
}

const mapPlaidLocation = (location: Location): string | null => {
    const locationString = [
        location.address,
        location.city,
        location.region,
        location.postal_code,
        location.country,
    ]
        .filter(Boolean)
        .join(', ')
    if (!locationString.length) return null
    return locationString
}
