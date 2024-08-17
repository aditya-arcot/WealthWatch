export interface Category {
    id: number
    name: string
}

export enum CategoryEnum {
    Uncategorized = 1,
    Income,
    Transfer,
    Deposit,
    Investment,
    Savings,
    LoanPayment,
    CreditCardPayment,
    Fees,
    Entertainment,
    FoodAndDrink,
    Groceries,
    Merchandise,
    Medical,
    PersonalCare,
    Services,
    Government,
    Donations,
    Taxes,
    Transportation,
    Travel,
    Bills,
}

export const categoryIcons: Record<CategoryEnum, string> = {
    [CategoryEnum.Uncategorized]: 'bi-question-circle',
    [CategoryEnum.Income]: 'bi-currency-dollar',
    [CategoryEnum.Transfer]: 'bi-arrow-left-right',
    [CategoryEnum.Deposit]: 'bi-bank',
    [CategoryEnum.Investment]: 'bi-graph-up',
    [CategoryEnum.Savings]: 'bi-piggy-bank',
    [CategoryEnum.LoanPayment]: 'bi-wallet',
    [CategoryEnum.CreditCardPayment]: 'bi-credit-card-2-front',
    [CategoryEnum.Fees]: 'bi-file-earmark-text',
    [CategoryEnum.Entertainment]: 'bi-controller',
    [CategoryEnum.FoodAndDrink]: 'bi-cup-straw',
    [CategoryEnum.Groceries]: 'bi-basket',
    [CategoryEnum.Merchandise]: 'bi-bag',
    [CategoryEnum.Medical]: 'bi-heart-pulse',
    [CategoryEnum.PersonalCare]: 'bi-person',
    [CategoryEnum.Services]: 'bi-tools',
    [CategoryEnum.Government]: 'bi-building',
    [CategoryEnum.Donations]: 'bi-heart',
    [CategoryEnum.Taxes]: 'bi-percent',
    [CategoryEnum.Transportation]: 'bi-car-front',
    [CategoryEnum.Travel]: 'bi-airplane',
    [CategoryEnum.Bills]: 'bi-receipt-cutoff',
}
