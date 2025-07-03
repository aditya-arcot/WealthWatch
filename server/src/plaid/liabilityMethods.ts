import {
    CreditCard,
    Item,
    Mortgage,
    StudentLoan,
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from '@wealthwatch-shared'
import {
    CreditCardLiability as PlaidCreditCard,
    MortgageLiability as PlaidMortgage,
    MortgagePropertyAddress as PlaidMortgageAddress,
    ServicerAddressData as PlaidServicerAddress,
    StudentLoan as PlaidStudentLoan,
    StudentRepaymentPlanTypeEnum as PlaidStudentLoanRepaymentTypeEnum,
    StudentLoanStatusTypeEnum as PlaidStudentLoanStatusTypeEnum,
} from 'plaid'
import { logger } from '../utilities/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidLiabilitiesGet = async (item: Item) => {
    logger.debug({ id: item.id }, 'getting item liabilities')
    const params = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
            student: resp.data.liabilities.student,
        }
    }
    return {
        credit: resp.data.liabilities.credit,
        mortgage: resp.data.liabilities.mortgage,
        student: resp.data.liabilities.student,
    }
}

export const mapPlaidCreditCard = (
    card: PlaidCreditCard,
    accountId: number
): CreditCard => ({
    id: -1,
    accountId,
    aprs: card.aprs,
    overdue: card.is_overdue,
    lastPaymentDate: card.last_payment_date
        ? new Date(card.last_payment_date)
        : null,
    lastPaymentAmount: card.last_payment_amount,
    lastStatementDate: card.last_statement_issue_date
        ? new Date(card.last_statement_issue_date)
        : null,
    lastStatementBalance: card.last_statement_balance,
    nextPaymentDueDate: card.next_payment_due_date
        ? new Date(card.next_payment_due_date)
        : null,
    minimumPaymentAmount: card.minimum_payment_amount,
})

export const mapPlaidMortgage = (
    mortgage: PlaidMortgage,
    accountId: number
): Mortgage => ({
    id: -1,
    accountId,
    type: mortgage.loan_type_description,
    interestRateType: mortgage.interest_rate.type,
    interestRatePercent: mortgage.interest_rate.percentage,
    term: mortgage.loan_term,
    address: mapPlaidLiabilityAddress(mortgage.property_address),
    originationDate: mortgage.origination_date
        ? new Date(mortgage.origination_date)
        : null,
    originationPrincipal: mortgage.origination_principal_amount,
    maturityDate: mortgage.maturity_date
        ? new Date(mortgage.maturity_date)
        : null,
    lateFee: mortgage.current_late_fee,
    escrowBalance: mortgage.escrow_balance,
    prepaymentPenalty: mortgage.has_prepayment_penalty,
    privateInsurance: mortgage.has_pmi,
    pastDueAmount: mortgage.past_due_amount,
    lastPaymentDate: mortgage.last_payment_date
        ? new Date(mortgage.last_payment_date)
        : null,
    lastPaymentAmount: mortgage.last_payment_amount,
    nextPaymentDueDate: mortgage.next_payment_due_date
        ? new Date(mortgage.next_payment_due_date)
        : null,
    nextPaymentAmount: mortgage.next_monthly_payment,
    ytdInterestPaid: mortgage.ytd_interest_paid,
    ytdPrincipalPaid: mortgage.ytd_principal_paid,
})

export const mapPlaidStudentLoan = (
    loan: PlaidStudentLoan,
    accountId: number
): StudentLoan => ({
    id: -1,
    accountId,
    name: loan.loan_name,
    interestRatePercent: loan.interest_rate_percentage,
    statusTypeId: mapPlaidStudentLoanStatusType(loan.loan_status.type),
    statusEndDate: loan.loan_status.end_date
        ? new Date(loan.loan_status.end_date)
        : null,
    overdue: loan.is_overdue,
    originationDate: loan.origination_date
        ? new Date(loan.origination_date)
        : null,
    originationPrincipal: loan.origination_principal_amount,
    disbursementDates: mapPlaidStudentLoanDisbursementDates(
        loan.disbursement_dates
    ),
    outstandingInterest: loan.outstanding_interest_amount,
    expectedPayoffDate: loan.expected_payoff_date
        ? new Date(loan.expected_payoff_date)
        : null,
    guarantor: loan.guarantor,
    servicerAddress: mapPlaidLiabilityAddress(loan.servicer_address),
    repaymentPlanTypeId: mapPlaidStudentLoanRepaymentPlanType(
        loan.repayment_plan.type
    ),
    repaymentPlanDescription: loan.repayment_plan.description,
    lastPaymentDate: loan.last_payment_date
        ? new Date(loan.last_payment_date)
        : null,
    lastPaymentAmount: loan.last_payment_amount,
    lastStatementDate: loan.last_statement_issue_date
        ? new Date(loan.last_statement_issue_date)
        : null,
    lastStatementBalance: loan.last_statement_balance || null,
    nextPaymentDueDate: loan.next_payment_due_date
        ? new Date(loan.next_payment_due_date)
        : null,
    minimumPaymentAmount: loan.minimum_payment_amount,
    ytdInterestPaid: loan.ytd_interest_paid,
    ytdPrincipalPaid: loan.ytd_principal_paid,
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

const mapPlaidStudentLoanStatusType = (
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
            return StudentLoanStatusTypeEnum.PendingIdr
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
            return StudentLoanRepaymentPlanTypeEnum.SavingOnValuableEducation
        case PlaidStudentLoanRepaymentTypeEnum.Other:
            return StudentLoanRepaymentPlanTypeEnum.Other
        case PlaidStudentLoanRepaymentTypeEnum.Null:
            return null
    }
}
