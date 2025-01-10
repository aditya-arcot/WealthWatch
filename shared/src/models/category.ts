export interface Category {
    id: CategoryEnum
    name: string
    groupId: CategoryGroupEnum
}

export enum CategoryEnum {
    Uncategorized = 1,
    Income,
    Transfer,
    CashAndChecks,
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
    Ignored,
}

export enum CategoryGroupEnum {
    Earning = 1,
    Spending,
    Ignored,
}
