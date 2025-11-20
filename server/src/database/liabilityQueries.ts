import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { CreditCard, Mortgage, StudentLoan } from '@wealthwatch-shared'

export const insertCreditCards = async (
    creditCards: CreditCard[]
): Promise<void> => {
    if (!creditCards.length) return

    const values: unknown[] = []
    creditCards.forEach((c) => {
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

    const rowCount = creditCards.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO credit_cards
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
    `

    await runQuery(query, values)
}

export const insertMortgages = async (mortgages: Mortgage[]): Promise<void> => {
    if (!mortgages.length) return

    const values: unknown[] = []
    mortgages.forEach((m) => {
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

    const rowCount = mortgages.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO mortgages
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
    `

    await runQuery(query, values)
}

export const insertStudentLoans = async (
    studentLoans: StudentLoan[]
): Promise<void> => {
    if (!studentLoans.length) return

    const values: unknown[] = []
    studentLoans.forEach((s) => {
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

    const rowCount = studentLoans.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO student_loans
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
    `

    await runQuery(query, values)
}
