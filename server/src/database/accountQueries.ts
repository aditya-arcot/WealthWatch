import {
    StudentLoanRepaymentPlanTypeEnum,
    StudentLoanStatusTypeEnum,
} from 'wealthwatch-shared/enums/liability.js'
import {
    Account,
    AccountWithHoldings,
    CreditCardAccount,
    MortgageAccount,
    StudentLoanAccount,
} from 'wealthwatch-shared/models/account.js'
import {
    DbHoldingWithSecurity,
    mapDbHoldingWithSecurity,
} from './holdingQueries.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertAccounts = async (
    accounts: Account[],
    updateBalances = false
): Promise<void> => {
    if (!accounts.length) return

    const values: unknown[] = []
    accounts.forEach((account) => {
        values.push(
            account.itemId,
            account.plaidId,
            account.active,
            account.name,
            account.mask,
            account.officialName,
            account.currentBalance,
            account.availableBalance,
            account.isoCurrencyCode,
            account.unofficialCurrencyCode,
            account.creditLimit,
            account.type,
            account.subtype
        )
    })

    const rowCount = accounts.length
    const paramCount = Math.floor(values.length / rowCount)
    let query = `
        INSERT INTO accounts
        (
            item_id,
            plaid_id,
            active,
            name,
            mask,
            official_name,
            current_balance,
            available_balance,
            iso_currency_code,
            unofficial_currency_code,
            credit_limit,
            type,
            subtype
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (plaid_id)
        DO UPDATE SET
            active = EXCLUDED.active,
            name = EXCLUDED.name,
            mask = EXCLUDED.mask,
            official_name = EXCLUDED.official_name,
        `
    if (updateBalances) {
        query += `
            current_balance = EXCLUDED.current_balance,
            available_balance = EXCLUDED.available_balance,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code,
            credit_limit = EXCLUDED.credit_limit,
        `
    }
    query += `
            type = EXCLUDED.type,
            subtype = EXCLUDED.subtype
    `

    await runQuery(query, values)
}

export const fetchActiveAccountsByUserId = async (
    userId: number
): Promise<Account[]> => {
    const query = `
        SELECT *
        FROM active_accounts
        WHERE user_id = $1
    `
    const rows = (await runQuery<DbAccount>(query, [userId])).rows
    return rows.map(mapDbAccount)
}

export const modifyAccountsToInactiveByPlaidItemId = async (
    plaidItemId: string
): Promise<void> => {
    const query = `
        UPDATE accounts a
        SET active = false
        FROM active_items ai
        WHERE ai.id = a.item_id
            and ai.plaid_id = $1
    `
    await runQuery(query, [plaidItemId])
}

export interface DbAccount {
    id: number
    item_id: number
    plaid_id: string
    active: boolean
    name: string
    mask: string | null
    official_name: string | null
    current_balance: number | null
    available_balance: number | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
    credit_limit: number | null
    type: string
    subtype: string | null
}

export const mapDbAccount = (acc: DbAccount): Account => ({
    id: acc.id,
    itemId: acc.item_id,
    plaidId: acc.plaid_id,
    active: acc.active,
    name: acc.name,
    mask: acc.mask,
    officialName: acc.official_name,
    currentBalance: acc.current_balance,
    availableBalance: acc.available_balance,
    isoCurrencyCode: acc.iso_currency_code,
    unofficialCurrencyCode: acc.unofficial_currency_code,
    creditLimit: acc.credit_limit,
    type: acc.type,
    subtype: acc.subtype,
})

export interface DbAccountWithHoldings extends DbAccount {
    holdings: DbHoldingWithSecurity[]
}

export const mapDbAccountWithHoldings = (
    acc: DbAccountWithHoldings
): AccountWithHoldings => ({
    ...mapDbAccount(acc),
    holdings: acc.holdings.map(mapDbHoldingWithSecurity),
})

export interface DbCreditCardAccount extends DbAccount {
    aprs: object
    overdue: boolean | null
    last_payment_date: Date | null
    last_payment_amount: number | null
    last_statement_date: Date | null
    last_statement_balance: number | null
    next_payment_due_date: Date | null
    minimum_payment_amount: number | null
}

export const mapCreditCardAccount = (
    acc: DbCreditCardAccount
): CreditCardAccount => ({
    ...mapDbAccount(acc),
    aprs: acc.aprs,
    overdue: acc.overdue,
    lastPaymentDate: acc.last_payment_date,
    lastPaymentAmount: acc.last_payment_amount,
    lastStatementDate: acc.last_statement_date,
    lastStatementBalance: acc.last_statement_balance,
    nextPaymentDueDate: acc.next_payment_due_date,
    minimumPaymentAmount: acc.minimum_payment_amount,
})

export interface DbMortgageAccount extends DbAccount {
    mortgage_type: string | null
    interest_rate_type: string | null
    interest_rate_percent: number
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

export const mapMortgageAccount = (
    acc: DbMortgageAccount
): MortgageAccount => ({
    ...mapDbAccount(acc),
    mortgageType: acc.mortgage_type,
    interestRateType: acc.interest_rate_type,
    interestRatePercent: acc.interest_rate_percent,
    term: acc.term,
    address: acc.address,
    originationDate: acc.origination_date,
    originationPrincipal: acc.origination_principal,
    maturityDate: acc.maturity_date,
    lateFee: acc.late_fee,
    escrowBalance: acc.escrow_balance,
    prepaymentPenalty: acc.prepayment_penalty,
    privateInsurance: acc.private_insurance,
    pastDueAmount: acc.past_due_amount,
    lastPaymentDate: acc.last_payment_date,
    lastPaymentAmount: acc.last_payment_amount,
    nextPaymentDueDate: acc.next_payment_due_date,
    nextPaymentAmount: acc.next_payment_amount,
    ytdInterestPaid: acc.ytd_interest_paid,
    ytdPrincipalPaid: acc.ytd_principal_paid,
})

export interface DbStudentLoanAccount extends DbAccount {
    student_loan_name: string | null
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
    repayment_plan_type_id: StudentLoanRepaymentPlanTypeEnum | null
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

export const mapStudentLoanAccount = (
    acc: DbStudentLoanAccount
): StudentLoanAccount => ({
    ...mapDbAccount(acc),
    studentLoanName: acc.student_loan_name,
    interestRatePercent: acc.interest_rate_percent,
    statusTypeId: acc.status_type_id,
    statusEndDate: acc.status_end_date,
    overdue: acc.overdue,
    originationDate: acc.origination_date,
    originationPrincipal: acc.origination_principal,
    disbursementDates: acc.disbursement_dates,
    outstandingInterest: acc.outstanding_interest,
    expectedPayoffDate: acc.expected_payoff_date,
    guarantor: acc.guarantor,
    servicerAddress: acc.servicer_address,
    repaymentPlanTypeId: acc.repayment_plan_type_id,
    repaymentPlanDescription: acc.repayment_plan_description,
    lastPaymentDate: acc.last_payment_date,
    lastPaymentAmount: acc.last_payment_amount,
    lastStatementDate: acc.last_statement_date,
    lastStatementBalance: acc.last_statement_balance,
    nextPaymentDueDate: acc.next_payment_due_date,
    minimumPaymentAmount: acc.minimum_payment_amount,
    ytdInterestPaid: acc.ytd_interest_paid,
    ytdPrincipalPaid: acc.ytd_principal_paid,
})
