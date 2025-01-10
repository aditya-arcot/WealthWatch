import {
    Location,
    RemovedTransaction as PlaidRemovedTransaction,
    Transaction as PlaidTransaction,
    TransactionPaymentChannelEnum,
    TransactionsRefreshRequest,
    TransactionsSyncRequest,
} from 'plaid'
import { CategoryEnum } from 'wealthwatch-shared/models/category.js'
import { Item } from 'wealthwatch-shared/models/item.js'
import {
    PaymentChannelEnum,
    Transaction,
} from 'wealthwatch-shared/models/transaction.js'
import { PlaidApiError } from '../models/error.js'
import {
    PlaidGeneralErrorCodeEnum,
    PlaidTransactionErrorCodeEnum,
} from '../models/plaidApiRequest.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidTransactionsRefresh = async (item: Item) => {
    logger.debug({ id: item.id }, 'refreshing item transactions')

    const params: TransactionsRefreshRequest = {
        access_token: item.accessToken,
    }

    try {
        await executePlaidMethod(
            getPlaidClient().transactionsRefresh,
            params,
            item.userId,
            item.id
        )
        return true
    } catch (error) {
        if (!(error instanceof PlaidApiError)) throw error
        if (error.code !== PlaidGeneralErrorCodeEnum.ProductsNotSupported)
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
                access_token: item.accessToken,
                options: {
                    include_original_description: true,
                },
            }
            if (cursor !== null) {
                params.cursor = cursor
            }
            const resp = await executePlaidMethod(
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
            error.code !==
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

enum PlaidDetailedCategoryEnum {
    TransferInDeposit = 'TRANSFER_IN_DEPOSIT',
    TransferInInvestment = 'TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS',
    TransferInSavings = 'TRANSFER_IN_SAVINGS',
    TransferOutInvestment = 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS',
    TransferOutSavings = 'TRANSFER_OUT_SAVINGS',
    TransferOutWithdrawal = 'TRANSFER_OUT_WITHDRAWAL',
    LoanPaymentsCreditCard = 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT',
    FoodAndDrinkGroceries = 'FOOD_AND_DRINK_GROCERIES',
    GovernmentAndNonProfitDonation = 'GOVERNMENT_AND_NON_PROFIT_DONATIONS',
    GovernmentAndNonProfitTaxes = 'GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT',
}

const detailedCategoryMap: Record<PlaidDetailedCategoryEnum, CategoryEnum> = {
    [PlaidDetailedCategoryEnum.TransferInDeposit]: CategoryEnum.CashAndChecks,
    [PlaidDetailedCategoryEnum.TransferInInvestment]: CategoryEnum.Investment,
    [PlaidDetailedCategoryEnum.TransferInSavings]: CategoryEnum.Savings,
    [PlaidDetailedCategoryEnum.TransferOutInvestment]: CategoryEnum.Investment,
    [PlaidDetailedCategoryEnum.TransferOutSavings]: CategoryEnum.Savings,
    [PlaidDetailedCategoryEnum.TransferOutWithdrawal]:
        CategoryEnum.CashAndChecks,
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
}

const primaryCategoryMap: Record<PlaidPrimaryCategoryEnum, CategoryEnum> = {
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
    if (!location) return null
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
