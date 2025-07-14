import {
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from '../enums/liability.js'

export interface CreditCard {
    id: number
    accountId: number
    aprs: object
    overdue: boolean | null
    lastPaymentDate: Date | null
    lastPaymentAmount: number | null
    lastStatementDate: Date | null
    lastStatementBalance: number | null
    nextPaymentDueDate: Date | null
    minimumPaymentAmount: number | null
}

export interface Mortgage {
    id: number
    accountId: number
    type: string | null
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

export interface StudentLoan {
    id: number
    accountId: number
    name: string | null
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
