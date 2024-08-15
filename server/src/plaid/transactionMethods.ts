import {
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionsRefreshRequest,
    TransactionsSyncRequest,
} from 'plaid'
import { CategoryEnum } from '../models/category.js'
import { Item } from '../models/item.js'
import { Transaction } from '../models/transaction.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidRefreshTransactions = async (item: Item) => {
    logger.debug({ item }, 'refreshing item transactions')
    const params: TransactionsRefreshRequest = {
        access_token: item.accessToken,
    }
    await executePlaidMethod(
        plaidClient.transactionsRefresh,
        params,
        item.userId,
        item.id
    )
}

export const plaidRetrieveTransactionUpdates = async (item: Item) => {
    logger.debug({ item }, 'retrieving transaction updates')

    let cursor = item.cursor
    let added: Array<PlaidTransaction> = []
    let modified: Array<PlaidTransaction> = []
    let removed: Array<PlaidRemovedTransaction> = []
    let hasMore = true

    while (hasMore) {
        let params: TransactionsSyncRequest
        if (cursor !== null) {
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
}

export const mapPlaidTransaction = (
    transaction: PlaidTransaction,
    accountId: number,
    existingTransactions: Transaction[]
): Transaction => {
    let customName = null
    let customCategoryId = null
    const primaryCategory = transaction.personal_finance_category?.primary
    const detailedCategory = transaction.personal_finance_category?.detailed
    const categoryId = mapPlaidCategory(primaryCategory, detailedCategory)

    // link previous pending transaction
    const pendingTransaction = existingTransactions.find(
        (t) => t.transactionId === transaction.pending_transaction_id
    )
    if (pendingTransaction) {
        customName = pendingTransaction.customName
        customCategoryId = pendingTransaction.customCategoryId
    }

    return {
        id: 0,
        accountId,
        transactionId: transaction.transaction_id,
        merchantId: transaction.merchant_entity_id ?? null,
        merchant: transaction.merchant_name ?? null,
        name: transaction.name,
        customName,
        amount: transaction.amount,
        primaryCategory: primaryCategory ?? null,
        detailedCategory: detailedCategory ?? null,
        categoryId,
        customCategoryId,
        paymentChannel: transaction.payment_channel,
        isoCurrencyCode: transaction.iso_currency_code,
        unofficialCurrencyCode: transaction.unofficial_currency_code,
        date: new Date(transaction.authorized_date ?? transaction.date),
        pending: transaction.pending,
    }
}

const mapPlaidCategory = (
    primary: string | undefined,
    detailed: string | undefined
): number => {
    const detailedEnum = detailed as PlaidDetailedCategoryEnum
    if (Object.values(PlaidDetailedCategoryEnum).indexOf(detailedEnum) >= 0) {
        return detailedCategoryMap[detailedEnum]
    }

    const primaryEnum = primary as PlaidPrimaryCategoryEnum
    if (Object.values(PlaidPrimaryCategoryEnum).indexOf(primaryEnum) >= 0) {
        return primaryCategoryMap[primaryEnum]
    }

    return CategoryEnum.Uncategorized
}

enum PlaidDetailedCategoryEnum {
    TransferInDeposit = 'TRANSFER_IN_DEPOSIT',
    TransferInInvestment = 'TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS',
    TransferInSavings = 'TRANSFER_IN_SAVINGS',
    TransferOutInvestment = 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS',
    TransferOutSavings = 'TRANSFER_OUT_SAVINGS',
    LoanPaymentsCreditCard = 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT',
    FoodAndDrinkGroceries = 'FOOD_AND_DRINK_GROCERIES',
    GovernmentAndNonProfitDonation = 'GOVERNMENT_AND_NON_PROFIT_DONATIONS',
    GovernmentAndNonProfitTaxes = 'GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT',
}

const detailedCategoryMap: {
    [key in PlaidDetailedCategoryEnum]: CategoryEnum
} = {
    [PlaidDetailedCategoryEnum.TransferInDeposit]: CategoryEnum.Deposit,
    [PlaidDetailedCategoryEnum.TransferInInvestment]: CategoryEnum.Investment,
    [PlaidDetailedCategoryEnum.TransferInSavings]: CategoryEnum.Savings,
    [PlaidDetailedCategoryEnum.TransferOutInvestment]: CategoryEnum.Investment,
    [PlaidDetailedCategoryEnum.TransferOutSavings]: CategoryEnum.Savings,
    [PlaidDetailedCategoryEnum.LoanPaymentsCreditCard]:
        CategoryEnum.CreditCardPayment,
    [PlaidDetailedCategoryEnum.FoodAndDrinkGroceries]: CategoryEnum.Groceries,
    [PlaidDetailedCategoryEnum.GovernmentAndNonProfitDonation]:
        CategoryEnum.Donations,
    [PlaidDetailedCategoryEnum.GovernmentAndNonProfitTaxes]: CategoryEnum.Taxes,
}

enum PlaidPrimaryCategoryEnum {
    Income = 'INCOME',
    TransferIn = 'TRANSFER_IN',
    TransferOut = 'TRANSFER_OUT',
    LoanPayments = 'LOAN_PAYMENTS',
    BankFees = 'BANK_FEES',
    Entertainment = 'ENTERTAINMENT',
    FoodAndDrink = 'FOOD_AND_DRINK',
    GeneralMerchandise = 'GENERAL_MERCHANDISE',
    HomeImprovement = 'HOME_IMPROVEMENT',
    Medical = 'MEDICAL',
    PersonalCare = 'PERSONAL_CARE',
    GeneralServices = 'GENERAL_SERVICES',
    GovernmentAndNonProfit = 'GOVERNMENT_AND_NON_PROFIT',
    Transportation = 'TRANSPORTATION',
    Travel = 'TRAVEL',
    RentAndUtilities = 'RENT_AND_UTILITIES',
    Other = 'OTHER',
}

const primaryCategoryMap: {
    [key in PlaidPrimaryCategoryEnum]: CategoryEnum
} = {
    [PlaidPrimaryCategoryEnum.Income]: CategoryEnum.Income,
    [PlaidPrimaryCategoryEnum.TransferIn]: CategoryEnum.Transfer,
    [PlaidPrimaryCategoryEnum.TransferOut]: CategoryEnum.Transfer,
    [PlaidPrimaryCategoryEnum.LoanPayments]: CategoryEnum.LoanPayment,
    [PlaidPrimaryCategoryEnum.BankFees]: CategoryEnum.Fees,
    [PlaidPrimaryCategoryEnum.Entertainment]: CategoryEnum.Entertainment,
    [PlaidPrimaryCategoryEnum.FoodAndDrink]: CategoryEnum.FoodAndDrink,
    [PlaidPrimaryCategoryEnum.GeneralMerchandise]: CategoryEnum.Merchandise,
    [PlaidPrimaryCategoryEnum.HomeImprovement]: CategoryEnum.Merchandise,
    [PlaidPrimaryCategoryEnum.Medical]: CategoryEnum.Medical,
    [PlaidPrimaryCategoryEnum.PersonalCare]: CategoryEnum.PersonalCare,
    [PlaidPrimaryCategoryEnum.GeneralServices]: CategoryEnum.Services,
    [PlaidPrimaryCategoryEnum.GovernmentAndNonProfit]: CategoryEnum.Government,
    [PlaidPrimaryCategoryEnum.Transportation]: CategoryEnum.Transportation,
    [PlaidPrimaryCategoryEnum.Travel]: CategoryEnum.Travel,
    [PlaidPrimaryCategoryEnum.RentAndUtilities]: CategoryEnum.Bills,
    [PlaidPrimaryCategoryEnum.Other]: CategoryEnum.Uncategorized,
}
