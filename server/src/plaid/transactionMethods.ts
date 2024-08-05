import {
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionsSyncRequest,
} from 'plaid'
import { CategoryEnum, PlaidCategoryEnum } from '../models/category.js'
import { Item } from '../models/item.js'
import { Transaction } from '../models/transaction.js'
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

export const mapPlaidTransaction = (
    transaction: PlaidTransaction,
    accountId: number
): Transaction => {
    const categoryId = mapPlaidCategory(
        transaction.personal_finance_category?.primary
    )
    return {
        id: 0,
        accountId,
        transactionId: transaction.transaction_id,
        name: transaction.name,
        amount: transaction.amount,
        merchant: transaction.merchant_name ?? null,
        merchantId: transaction.merchant_entity_id ?? null,
        categoryId,
        detailedCategory:
            transaction.personal_finance_category?.detailed ?? null,
        paymentChannel: transaction.payment_channel,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        date: new Date(transaction.authorized_date ?? transaction.date),
        pending: transaction.pending,
    }
}

const mapPlaidCategory = (plaidCategory: string | null | undefined): number => {
    const plaidCategoryEnum = plaidCategory as PlaidCategoryEnum
    if (!Object.values(PlaidCategoryEnum).includes(plaidCategoryEnum)) {
        return CategoryEnum.Other
    }
    return plaidCategoryMap[plaidCategoryEnum]
}

const plaidCategoryMap: { [key in PlaidCategoryEnum]: CategoryEnum } = {
    [PlaidCategoryEnum.Income]: CategoryEnum.Income,
    [PlaidCategoryEnum.TransferIn]: CategoryEnum.TransferIn,
    [PlaidCategoryEnum.TransferOut]: CategoryEnum.TransferOut,
    [PlaidCategoryEnum.LoanPayments]: CategoryEnum.LoanPayment,
    [PlaidCategoryEnum.BankFees]: CategoryEnum.Fees,
    [PlaidCategoryEnum.Entertainment]: CategoryEnum.Entertainment,
    [PlaidCategoryEnum.FoodAndDrink]: CategoryEnum.FoodAndDrink,
    [PlaidCategoryEnum.GeneralMerchandise]: CategoryEnum.Merchandise,
    [PlaidCategoryEnum.HomeImprovement]: CategoryEnum.Merchandise,
    [PlaidCategoryEnum.Medical]: CategoryEnum.Medical,
    [PlaidCategoryEnum.PersonalCare]: CategoryEnum.PersonalCare,
    [PlaidCategoryEnum.GeneralServices]: CategoryEnum.Services,
    [PlaidCategoryEnum.GovernmentAndNonProfit]:
        CategoryEnum.GovernmentAndCharity,
    [PlaidCategoryEnum.Transportation]: CategoryEnum.Transportation,
    [PlaidCategoryEnum.Travel]: CategoryEnum.Travel,
    [PlaidCategoryEnum.RentAndUtilities]: CategoryEnum.BillsAndUtilities,
    [PlaidCategoryEnum.Other]: CategoryEnum.Other,
}
