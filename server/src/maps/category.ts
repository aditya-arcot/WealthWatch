import { CategoryEnum } from 'wealthwatch-shared'
import {
    PlaidDetailedCategoryEnum,
    PlaidPrimaryCategoryEnum,
} from '../enums/category.js'

export const primaryCategoryMap: Record<
    PlaidPrimaryCategoryEnum,
    CategoryEnum
> = {
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

export const detailedCategoryMap: Record<
    PlaidDetailedCategoryEnum,
    CategoryEnum
> = {
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
