import {
    CreditCardLiability,
    MortgageLiability,
    StudentLoanLiability,
    StudentLoanStatusTypeEnum,
} from '../models/liability.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertCreditCardLiabilities = async (
    creditCardLiabilities: CreditCardLiability[]
): Promise<CreditCardLiability[] | undefined> => {
    if (!creditCardLiabilities.length) return

    const values: unknown[] = []
    creditCardLiabilities.forEach((c) => {
        values.push(
            c.accountId,
            JSON.stringify(c.aprs),
            c.overdue,
            c.lastPaymentDate,
            c.lastPaymentAmount,
            c.lastStatementDate,
            c.lastStatementBalance,
            c.nextPaymentDueDate,
            c.minimumPaymentAmount
        )
    })

    const rowCount = creditCardLiabilities.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO credit_card_liabilities
        (
            account_id,
            aprs,
            overdue,
            last_payment_date,
            last_payment_amount,
            last_statement_date,
            last_statement_balance,
            next_payment_due_date,
            minimum_payment_amount
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (account_id)
        DO UPDATE SET
            aprs = EXCLUDED.aprs,
            overdue = EXCLUDED.overdue,
            last_payment_date = EXCLUDED.last_payment_date,
            last_payment_amount = EXCLUDED.last_payment_amount,
            last_statement_date = EXCLUDED.last_statement_date,
            last_statement_balance = EXCLUDED.last_statement_balance,
            next_payment_due_date = EXCLUDED.next_payment_due_date,
            minimum_payment_amount = EXCLUDED.minimum_payment_amount
        RETURNING *
    `

    const rows = (await runQuery<DbCreditCardLiability>(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbCreditCardLiability)
}

export const insertMortgageLiabilities = async (
    mortgageLiabilities: MortgageLiability[]
): Promise<MortgageLiability[] | undefined> => {
    if (!mortgageLiabilities.length) return

    const values: unknown[] = []
    mortgageLiabilities.forEach((m) => {
        values.push(
            m.accountId,
            m.type,
            m.interestRateType,
            m.interestRatePercent,
            m.term,
            m.address,
            m.originationDate,
            m.originationPrincipal,
            m.maturityDate,
            m.lateFee,
            m.escrowBalance,
            m.prepaymentPenalty,
            m.privateInsurance,
            m.pastDueAmount,
            m.lastPaymentDate,
            m.lastPaymentAmount,
            m.nextPaymentDueDate,
            m.nextPaymentAmount,
            m.ytdInterestPaid,
            m.ytdPrincipalPaid
        )
    })

    const rowCount = mortgageLiabilities.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO mortgage_liabilities
        (
            account_id,
            type,
            interest_rate_type,
            interest_rate_percent,
            term,
            address,
            origination_date,
            origination_principal,
            maturity_date,
            late_fee,
            escrow_balance,
            prepayment_penalty,
            private_insurance,
            past_due_amount,
            last_payment_date,
            last_payment_amount,
            next_payment_due_date,
            next_payment_amount,
            ytd_interest_paid,
            ytd_principal_paid
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (account_id)
        DO UPDATE SET
            type = EXCLUDED.type,
            interest_rate_type = EXCLUDED.interest_rate_type,
            interest_rate_percent = EXCLUDED.interest_rate_percent,
            term = EXCLUDED.term,
            address = EXCLUDED.address,
            origination_date = EXCLUDED.origination_date,
            origination_principal = EXCLUDED.origination_principal,
            maturity_date = EXCLUDED.maturity_date,
            late_fee = EXCLUDED.late_fee,
            escrow_balance = EXCLUDED.escrow_balance,
            prepayment_penalty = EXCLUDED.prepayment_penalty,
            private_insurance = EXCLUDED.private_insurance,
            past_due_amount = EXCLUDED.past_due_amount,
            last_payment_date = EXCLUDED.last_payment_date,
            last_payment_amount = EXCLUDED.last_payment_amount,
            next_payment_due_date = EXCLUDED.next_payment_due_date,
            next_payment_amount = EXCLUDED.next_payment_amount,
            ytd_interest_paid = EXCLUDED.ytd_interest_paid,
            ytd_principal_paid = EXCLUDED.ytd_principal_paid
        RETURNING *
    `

    const rows = (await runQuery<DbMortgageLiability>(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbMortgageLiability)
}

export const insertStudentLoanLiabilities = async (
    studentLoanLiabilities: StudentLoanLiability[]
): Promise<StudentLoanLiability[] | undefined> => {
    if (!studentLoanLiabilities.length) return

    const values: unknown[] = []
    studentLoanLiabilities.forEach((s) => {
        values.push(
            s.accountId,
            s.name,
            s.interestRatePercent,
            s.statusTypeId,
            s.statusEndDate,
            s.overdue,
            s.originationDate,
            s.originationPrincipal,
            s.disbursementDates,
            s.outstandingInterest,
            s.expectedPayoffDate,
            s.guarantor,
            s.servicerAddress,
            s.repaymentPlanTypeId,
            s.repaymentPlanDescription,
            s.lastPaymentDate,
            s.lastPaymentAmount,
            s.lastStatementDate,
            s.lastStatementBalance,
            s.nextPaymentDueDate,
            s.minimumPaymentAmount,
            s.ytdInterestPaid,
            s.ytdPrincipalPaid
        )
    })

    const rowCount = studentLoanLiabilities.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO student_loan_liabilities
        (
            account_id,
            name,
            interest_rate_percent,
            status_type_id,
            status_end_date,
            overdue,
            origination_date,
            origination_principal,
            disbursement_dates,
            outstanding_interest,
            expected_payoff_date,
            guarantor,
            servicer_address,
            repayment_plan_type_id,
            repayment_plan_description,
            last_payment_date,
            last_payment_amount,
            last_statement_date,
            last_statement_balance,
            next_payment_due_date,
            minimum_payment_amount,
            ytd_interest_paid,
            ytd_principal_paid
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}    
        ON CONFLICT (account_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            interest_rate_percent = EXCLUDED.interest_rate_percent,
            status_type_id = EXCLUDED.status_type_id,
            status_end_date = EXCLUDED.status_end_date,
            overdue = EXCLUDED.overdue,
            origination_date = EXCLUDED.origination_date,
            origination_principal = EXCLUDED.origination_principal,
            disbursement_dates = EXCLUDED.disbursement_dates,
            outstanding_interest = EXCLUDED.outstanding_interest,
            expected_payoff_date = EXCLUDED.expected_payoff_date,
            guarantor = EXCLUDED.guarantor,
            servicer_address = EXCLUDED.servicer_address,
            repayment_plan_type_id = EXCLUDED.repayment_plan_type_id,
            repayment_plan_description = EXCLUDED.repayment_plan_description,
            last_payment_date = EXCLUDED.last_payment_date,
            last_payment_amount = EXCLUDED.last_payment_amount,
            last_statement_date = EXCLUDED.last_statement_date,
            last_statement_balance = EXCLUDED.last_statement_balance,
            next_payment_due_date = EXCLUDED.next_payment_due_date,
            minimum_payment_amount = EXCLUDED.minimum_payment_amount,
            ytd_interest_paid = EXCLUDED.ytd_interest_paid,
            ytd_principal_paid = EXCLUDED.ytd_principal_paid
        RETURNING *
    `

    const rows = (await runQuery<DbStudentLoanLiability>(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbStudentLoanLiability)
}

interface DbCreditCardLiability {
    id: number
    account_id: number
    aprs: object
    overdue: boolean | null
    last_payment_date: Date | null
    last_payment_amount: number | null
    last_statement_date: Date | null
    last_statement_balance: number | null
    next_payment_due_date: Date | null
    minimum_payment_amount: number | null
}

const mapDbCreditCardLiability = (
    creditCardLiabilities: DbCreditCardLiability
): CreditCardLiability => ({
    id: creditCardLiabilities.id,
    accountId: creditCardLiabilities.account_id,
    aprs: creditCardLiabilities.aprs,
    overdue: creditCardLiabilities.overdue,
    lastPaymentDate: creditCardLiabilities.last_payment_date,
    lastPaymentAmount: creditCardLiabilities.last_payment_amount,
    lastStatementDate: creditCardLiabilities.last_statement_date,
    lastStatementBalance: creditCardLiabilities.last_statement_balance,
    nextPaymentDueDate: creditCardLiabilities.next_payment_due_date,
    minimumPaymentAmount: creditCardLiabilities.minimum_payment_amount,
})

interface DbMortgageLiability {
    id: number
    account_id: number
    type: string | null
    interest_rate_type: string | null
    interest_rate_percent: number | null
    term: string | null
    address: string | null
    origination_date: Date | null
    origination_principal: number | null
    maturity_date: Date | null
    late_fee: number | null
    escrow_balance: number | null
    prepayment_penalty: boolean | null
    private_insurance: boolean | null
    past_due_amount: number | null
    last_payment_date: Date | null
    last_payment_amount: number | null
    next_payment_due_date: Date | null
    next_payment_amount: number | null
    ytd_interest_paid: number | null
    ytd_principal_paid: number | null
}

const mapDbMortgageLiability = (
    mortgageLiability: DbMortgageLiability
): MortgageLiability => ({
    id: mortgageLiability.id,
    accountId: mortgageLiability.account_id,
    type: mortgageLiability.type,
    interestRateType: mortgageLiability.interest_rate_type,
    interestRatePercent: mortgageLiability.interest_rate_percent,
    term: mortgageLiability.term,
    address: mortgageLiability.address,
    originationDate: mortgageLiability.origination_date,
    originationPrincipal: mortgageLiability.origination_principal,
    maturityDate: mortgageLiability.maturity_date,
    lateFee: mortgageLiability.late_fee,
    escrowBalance: mortgageLiability.escrow_balance,
    prepaymentPenalty: mortgageLiability.prepayment_penalty,
    privateInsurance: mortgageLiability.private_insurance,
    pastDueAmount: mortgageLiability.past_due_amount,
    lastPaymentDate: mortgageLiability.last_payment_date,
    lastPaymentAmount: mortgageLiability.last_payment_amount,
    nextPaymentDueDate: mortgageLiability.next_payment_due_date,
    nextPaymentAmount: mortgageLiability.next_payment_amount,
    ytdInterestPaid: mortgageLiability.ytd_interest_paid,
    ytdPrincipalPaid: mortgageLiability.ytd_principal_paid,
})

interface DbStudentLoanLiability {
    id: number
    account_id: number
    name: string | null
    interest_rate_percent: number
    status_type_id: StudentLoanStatusTypeEnum | null
    status_end_date: Date | null
    overdue: boolean | null
    origination_date: Date | null
    origination_principal: number | null
    disbursement_dates: string | null
    outstanding_interest: number | null
    expected_payoff_date: Date | null
    guarantor: string | null
    servicer_address: string | null
    repayment_plan_type_id: number | null
    repayment_plan_description: string | null
    last_payment_date: Date | null
    last_payment_amount: number | null
    last_statement_date: Date | null
    last_statement_balance: number | null
    next_payment_due_date: Date | null
    minimum_payment_amount: number | null
    ytd_interest_paid: number | null
    ytd_principal_paid: number | null
}

const mapDbStudentLoanLiability = (
    studentLoanLiability: DbStudentLoanLiability
): StudentLoanLiability => ({
    id: studentLoanLiability.id,
    accountId: studentLoanLiability.account_id,
    name: studentLoanLiability.name,
    interestRatePercent: studentLoanLiability.interest_rate_percent,
    statusTypeId: studentLoanLiability.status_type_id,
    statusEndDate: studentLoanLiability.status_end_date,
    overdue: studentLoanLiability.overdue,
    originationDate: studentLoanLiability.origination_date,
    originationPrincipal: studentLoanLiability.origination_principal,
    disbursementDates: studentLoanLiability.disbursement_dates,
    outstandingInterest: studentLoanLiability.outstanding_interest,
    expectedPayoffDate: studentLoanLiability.expected_payoff_date,
    guarantor: studentLoanLiability.guarantor,
    servicerAddress: studentLoanLiability.servicer_address,
    repaymentPlanTypeId: studentLoanLiability.repayment_plan_type_id,
    repaymentPlanDescription: studentLoanLiability.repayment_plan_description,
    lastPaymentDate: studentLoanLiability.last_payment_date,
    lastPaymentAmount: studentLoanLiability.last_payment_amount,
    lastStatementDate: studentLoanLiability.last_statement_date,
    lastStatementBalance: studentLoanLiability.last_statement_balance,
    nextPaymentDueDate: studentLoanLiability.next_payment_due_date,
    minimumPaymentAmount: studentLoanLiability.minimum_payment_amount,
    ytdInterestPaid: studentLoanLiability.ytd_interest_paid,
    ytdPrincipalPaid: studentLoanLiability.ytd_principal_paid,
})
