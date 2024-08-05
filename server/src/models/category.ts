export interface Category {
    id: number
    name: string
}

export enum PlaidCategoryEnum {
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

export enum CategoryEnum {
    Income = 0,
    TransferIn,
    TransferOut,
    LoanPayment,
    Fees,
    Entertainment,
    FoodAndDrink,
    Merchandise,
    Medical,
    PersonalCare,
    Services,
    GovernmentAndCharity,
    Transportation,
    Travel,
    BillsAndUtilities,
    Other,
}
