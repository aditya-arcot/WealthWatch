import {
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from '../enums/index.js'
import { HoldingWithSecurity } from '../models/index.js'

export interface Account {
    id: number
    itemId: number
    plaidId: string
    active: boolean
    name: string
    mask: string | null
    officialName: string | null
    currentBalance: number | null
    availableBalance: number | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    creditLimit: number | null
    type: string
    subtype: string | null
}

export interface AccountWithHoldings extends Account {
    holdings: HoldingWithSecurity[]
}

export interface CreditCardAccount extends Account {
    aprs: object
    overdue: boolean | null
    lastPaymentDate: Date | null
    lastPaymentAmount: number | null
    lastStatementDate: Date | null
    lastStatementBalance: number | null
    nextPaymentDueDate: Date | null
    minimumPaymentAmount: number | null
}

export interface MortgageAccount extends Account {
    mortgageType: string | null
    interestRateType: string | null
    interestRatePercent: number | null
    term: string | null
    address: string | null
    originationDate: Date | null
    originationPrincipal: number | null
    maturityDate: Date | null
    lateFee: number | null
    escrowBalance: number | null
    prepaymentPenalty: boolean | null
    privateInsurance: boolean | null
    pastDueAmount: number | null
    lastPaymentDate: Date | null
    lastPaymentAmount: number | null
    nextPaymentDueDate: Date | null
    nextPaymentAmount: number | null
    ytdInterestPaid: number | null
    ytdPrincipalPaid: number | null
}

export interface StudentLoanAccount extends Account {
    studentLoanName: string | null
    interestRatePercent: number
    statusTypeId: StudentLoanStatusTypeEnum | null
    statusEndDate: Date | null
    overdue: boolean | null
    originationDate: Date | null
    originationPrincipal: number | null
    disbursementDates: string | null
    outstandingInterest: number | null
    expectedPayoffDate: Date | null
    guarantor: string | null
    servicerAddress: string | null
    repaymentPlanTypeId: StudentLoanRepaymentPlanTypeEnum | null
    repaymentPlanDescription: string | null
    lastPaymentDate: Date | null
    lastPaymentAmount: number | null
    lastStatementDate: Date | null
    lastStatementBalance: number | null
    nextPaymentDueDate: Date | null
    minimumPaymentAmount: number | null
    ytdInterestPaid: number | null
    ytdPrincipalPaid: number | null
}
