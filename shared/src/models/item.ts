import {
    Account,
    AccountWithHoldings,
    CreditCardAccount,
    MortgageAccount,
    StudentLoanAccount,
} from '../models/index.js'

export interface Item {
    id: number
    userId: number
    plaidId: string
    active: boolean
    accessToken: string
    institutionId: string
    institutionName: string
    healthy: boolean
    cursor: string | null
    lastRefreshed: Date | null
    transactionsLastRefreshed: Date | null
    investmentsLastRefreshed: Date | null
}

export interface ItemWithAccounts extends Item {
    accounts: Account[]
}

export interface ItemWithAccountsWithHoldings extends Item {
    accounts: AccountWithHoldings[]
}

export interface ItemWithAccountsWithLiabilities extends Item {
    accounts: (CreditCardAccount | StudentLoanAccount | MortgageAccount)[]
}

export interface ItemWithCreditCardAccounts extends Item {
    accounts: CreditCardAccount[]
}

export interface ItemWithMortgageAccounts extends Item {
    accounts: MortgageAccount[]
}

export interface ItemWithStudentLoanAccounts extends Item {
    accounts: StudentLoanAccount[]
}
