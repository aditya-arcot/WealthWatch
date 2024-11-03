import {
    CreditCardLiability as PlaidCreditCardLiability,
    MortgagePropertyAddress as PlaidMortgageAddress,
    MortgageLiability as PlaidMortgageLiability,
    ServicerAddressData as PlaidServicerAddress,
    StudentLoan as PlaidStudentLoanLiability,
    StudentRepaymentPlanTypeEnum as PlaidStudentLoanRepaymentTypeEnum,
    StudentLoanStatusTypeEnum as PlaidStudentLoanStatusTypeEnum,
} from 'plaid'
import { Item } from '../models/item.js'
import {
    CreditCardLiability,
    MortgageLiability,
    StudentLoanLiability,
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from '../models/liability.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidLiabilitiesGet = async (item: Item) => {
    logger.debug({ id: item.id }, 'getting item liabilities')
    const params = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        getPlaidClient().liabilitiesGet,
        params,
        item.userId,
        item.id
    )
    if (resp.data.liabilities.student) {
        return {
            credit: resp.data.liabilities.credit,
            mortgage: resp.data.liabilities.mortgage,
            student: resp.data.liabilities
                .student as PlaidStudentLoanLiabilityWithBalance[],
        }
    }
    return {
        credit: resp.data.liabilities.credit,
        mortgage: resp.data.liabilities.mortgage,
        student: resp.data.liabilities.student,
    }
}

export const mapPlaidCreditCardLiability = (
    liability: PlaidCreditCardLiability,
    accountId: number
): CreditCardLiability => ({
    id: -1,
    accountId,
    aprs: liability.aprs,
    overdue: liability.is_overdue,
    lastPaymentDate: liability.last_payment_date
        ? new Date(liability.last_payment_date)
        : null,
    lastPaymentAmount: liability.last_payment_amount,
    lastStatementDate: liability.last_statement_issue_date
        ? new Date(liability.last_statement_issue_date)
        : null,
    lastStatementBalance: liability.last_statement_balance,
    nextPaymentDueDate: liability.next_payment_due_date
        ? new Date(liability.next_payment_due_date)
        : null,
    minimumPaymentAmount: liability.minimum_payment_amount,
})

export const mapPlaidMortgageLiability = (
    liability: PlaidMortgageLiability,
    accountId: number
): MortgageLiability => ({
    id: -1,
    accountId,
    type: liability.loan_type_description,
    interestRateType: liability.interest_rate.type,
    interestRatePercent: liability.interest_rate.percentage,
    term: liability.loan_term,
    address: mapPlaidLiabilityAddress(liability.property_address),
    originationDate: liability.origination_date
        ? new Date(liability.origination_date)
        : null,
    originationPrincipal: liability.origination_principal_amount,
    maturityDate: liability.maturity_date
        ? new Date(liability.maturity_date)
        : null,
    lateFee: liability.current_late_fee,
    escrowBalance: liability.escrow_balance,
    prepaymentPenalty: liability.has_prepayment_penalty,
    privateInsurance: liability.has_pmi,
    pastDueAmount: liability.past_due_amount,
    lastPaymentDate: liability.last_payment_date
        ? new Date(liability.last_payment_date)
        : null,
    lastPaymentAmount: liability.last_payment_amount,
    nextPaymentDueDate: liability.next_payment_due_date
        ? new Date(liability.next_payment_due_date)
        : null,
    nextPaymentAmount: liability.next_monthly_payment,
    ytdInterestPaid: liability.ytd_interest_paid,
    ytdPrincipalPaid: liability.ytd_principal_paid,
})

export type PlaidStudentLoanLiabilityWithBalance = PlaidStudentLoanLiability & {
    last_statement_balance: number | null
}

export const mapPlaidStudentLoanLiability = (
    liability: PlaidStudentLoanLiabilityWithBalance,
    accountId: number
): StudentLoanLiability => ({
    id: -1,
    accountId,
    name: liability.loan_name,
    interestRatePercent: liability.interest_rate_percentage,
    statusTypeId: mapPlaidStudentLoanLiabilityStatusType(
        liability.loan_status.type
    ),
    statusEndDate: liability.loan_status.end_date
        ? new Date(liability.loan_status.end_date)
        : null,
    overdue: liability.is_overdue,
    originationDate: liability.origination_date
        ? new Date(liability.origination_date)
        : null,
    originationPrincipal: liability.origination_principal_amount,
    disbursementDates: mapPlaidStudentLoanDisbursementDates(
        liability.disbursement_dates
    ),
    outstandingInterest: liability.outstanding_interest_amount,
    expectedPayoffDate: liability.expected_payoff_date
        ? new Date(liability.expected_payoff_date)
        : null,
    guarantor: liability.guarantor,
    servicerAddress: mapPlaidLiabilityAddress(liability.servicer_address),
    repaymentPlanTypeId: mapPlaidStudentLoanRepaymentPlanType(
        liability.repayment_plan.type
    ),
    repaymentPlanDescription: liability.repayment_plan.description,
    lastPaymentDate: liability.last_payment_date
        ? new Date(liability.last_payment_date)
        : null,
    lastPaymentAmount: liability.last_payment_amount,
    lastStatementDate: liability.last_statement_issue_date
        ? new Date(liability.last_statement_issue_date)
        : null,
    lastStatementBalance: liability.last_statement_balance,
    nextPaymentDueDate: liability.next_payment_due_date
        ? new Date(liability.next_payment_due_date)
        : null,
    minimumPaymentAmount: liability.minimum_payment_amount,
    ytdInterestPaid: liability.ytd_interest_paid,
    ytdPrincipalPaid: liability.ytd_principal_paid,
})

const mapPlaidLiabilityAddress = (
    address: PlaidMortgageAddress | PlaidServicerAddress
): string | null => {
    if (!address) return null
    const addressString = [
        address.street,
        address.city,
        address.region,
        address.postal_code,
        address.country,
    ]
        .filter(Boolean)
        .join(', ')
    if (!addressString.length) return null
    return addressString
}

const mapPlaidStudentLoanDisbursementDates = (
    dates: string[] | null
): string | null => {
    if (!dates) return null
    return dates.join(' | ')
}

const mapPlaidStudentLoanLiabilityStatusType = (
    type: PlaidStudentLoanStatusTypeEnum | null
): StudentLoanStatusTypeEnum | null => {
    if (!type) return null
    switch (type) {
        case PlaidStudentLoanStatusTypeEnum.Cancelled:
            return StudentLoanStatusTypeEnum.Cancelled
        case PlaidStudentLoanStatusTypeEnum.ChargedOff:
            return StudentLoanStatusTypeEnum.ChargedOff
        case PlaidStudentLoanStatusTypeEnum.Claim:
            return StudentLoanStatusTypeEnum.Claim
        case PlaidStudentLoanStatusTypeEnum.Consolidated:
            return StudentLoanStatusTypeEnum.Consolidated
        case PlaidStudentLoanStatusTypeEnum.Deferment:
            return StudentLoanStatusTypeEnum.Deferment
        case PlaidStudentLoanStatusTypeEnum.Delinquent:
            return StudentLoanStatusTypeEnum.Delinquent
        case PlaidStudentLoanStatusTypeEnum.Discharged:
            return StudentLoanStatusTypeEnum.Discharged
        case PlaidStudentLoanStatusTypeEnum.Extension:
            return StudentLoanStatusTypeEnum.Extension
        case PlaidStudentLoanStatusTypeEnum.Forbearance:
            return StudentLoanStatusTypeEnum.Forbearance
        case PlaidStudentLoanStatusTypeEnum.InGrace:
            return StudentLoanStatusTypeEnum.InGrace
        case PlaidStudentLoanStatusTypeEnum.InMilitary:
            return StudentLoanStatusTypeEnum.InMilitary
        case PlaidStudentLoanStatusTypeEnum.InSchool:
            return StudentLoanStatusTypeEnum.InSchool
        case PlaidStudentLoanStatusTypeEnum.NotFullyDisbursed:
            return StudentLoanStatusTypeEnum.NotFullyDisbursed
        case PlaidStudentLoanStatusTypeEnum.PaidInFull:
            return StudentLoanStatusTypeEnum.PaidInFull
        case PlaidStudentLoanStatusTypeEnum.Refunded:
            return StudentLoanStatusTypeEnum.Refunded
        case PlaidStudentLoanStatusTypeEnum.Repayment:
            return StudentLoanStatusTypeEnum.Repayment
        case PlaidStudentLoanStatusTypeEnum.Transferred:
            return StudentLoanStatusTypeEnum.Transferred
        case PlaidStudentLoanStatusTypeEnum.PendingIdr:
            return StudentLoanStatusTypeEnum.PendingIDR
        case PlaidStudentLoanStatusTypeEnum.Other:
            return StudentLoanStatusTypeEnum.Other
    }
}

const mapPlaidStudentLoanRepaymentPlanType = (
    type: PlaidStudentLoanRepaymentTypeEnum | null
): StudentLoanRepaymentPlanTypeEnum | null => {
    if (!type) return null
    switch (type) {
        case PlaidStudentLoanRepaymentTypeEnum.Graduated:
            return StudentLoanRepaymentPlanTypeEnum.Graduated
        case PlaidStudentLoanRepaymentTypeEnum.Standard:
            return StudentLoanRepaymentPlanTypeEnum.Standard
        case PlaidStudentLoanRepaymentTypeEnum.ExtendedGraduated:
            return StudentLoanRepaymentPlanTypeEnum.ExtendedGraduated
        case PlaidStudentLoanRepaymentTypeEnum.ExtendedStandard:
            return StudentLoanRepaymentPlanTypeEnum.ExtendedStandard
        case PlaidStudentLoanRepaymentTypeEnum.IncomeContingentRepayment:
            return StudentLoanRepaymentPlanTypeEnum.IncomeContingentRepayment
        case PlaidStudentLoanRepaymentTypeEnum.IncomeBasedRepayment:
            return StudentLoanRepaymentPlanTypeEnum.IncomeBasedRepayment
        case PlaidStudentLoanRepaymentTypeEnum.IncomeSensitiveRepayment:
            return StudentLoanRepaymentPlanTypeEnum.IncomeSensitiveRepayment
        case PlaidStudentLoanRepaymentTypeEnum.InterestOnly:
            return StudentLoanRepaymentPlanTypeEnum.InterestOnly
        case PlaidStudentLoanRepaymentTypeEnum.PayAsYouEarn:
            return StudentLoanRepaymentPlanTypeEnum.PayAsYouEarn
        case PlaidStudentLoanRepaymentTypeEnum.RevisedPayAsYouEarn:
            return StudentLoanRepaymentPlanTypeEnum.RevisedPayAsYouEarn
        case PlaidStudentLoanRepaymentTypeEnum.SavingOnAValuableEducation:
            return StudentLoanRepaymentPlanTypeEnum.SavingOnAValuableEducation
        case PlaidStudentLoanRepaymentTypeEnum.Other:
            return StudentLoanRepaymentPlanTypeEnum.Other
        case PlaidStudentLoanRepaymentTypeEnum.Null:
            return null
    }
}
