import {
    DbAccount,
    DbAccountWithHoldings,
    DbCreditCardAccount,
    DbMortgageAccount,
    DbStudentLoanAccount,
    mapCreditCardAccount,
    mapDbAccount,
    mapDbAccountWithHoldings,
    mapMortgageAccount,
    mapStudentLoanAccount,
} from '@database/accountQueries.js'
import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { DatabaseError } from '@models/error.js'
import {
    Item,
    ItemWithAccounts,
    ItemWithAccountsWithHoldings,
    ItemWithCreditCardAccounts,
    ItemWithMortgageAccounts,
    ItemWithStudentLoanAccounts,
} from '@wealthwatch-shared'

export const insertItem = async (item: Item): Promise<Item> => {
    const values: unknown[] = [
        item.userId,
        item.plaidId,
        item.active,
        item.accessToken,
        item.institutionId,
        item.institutionName,
        item.healthy,
        item.cursor,
        item.lastRefreshed,
        item.transactionsLastRefreshed,
        item.investmentsLastRefreshed,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO items (
            user_id,
            plaid_id,
            active,
            access_token,
            institution_id,
            institution_name,
            healthy,
            cursor,
            last_refreshed,
            transactions_last_refreshed,
            investments_last_refreshed
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbItem>(query, values)).rows
    if (!rows[0]) throw new DatabaseError('failed to insert item')
    return mapDbItem(rows[0])
}

export const fetchActiveItemByPlaidId = async (
    plaidId: string
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE plaid_id = $1
        LIMIT 1
    `
    const rows = (await runQuery<DbItem>(query, [plaidId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const fetchActiveItemsByUserId = async (
    userId: number
): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
    `
    const rows = (await runQuery<DbItem>(query, [userId])).rows
    return rows.map(mapDbItem)
}

export const fetchActiveItemsWithAccountsByUserId = async (
    userId: number
): Promise<ItemWithAccounts[]> => {
    const query = `
        SELECT
            i.*,
            ARRAY_AGG (TO_JSONB (a.*)) as accounts
        FROM items i
        JOIN accounts a
            ON a.item_id = i.id
            AND a.active = TRUE
        WHERE i.user_id = $1
            AND i.active = TRUE
        GROUP BY i.id
    `
    const rows = (await runQuery<DbItemWithAccounts>(query, [userId])).rows
    return rows.map(mapDbItemWithAccounts)
}

export const fetchActiveItemsWithAccountsWithHoldingsByUserId = async (
    userId: number
): Promise<ItemWithAccountsWithHoldings[]> => {
    const query = `
        SELECT
            i.*,
            ARRAY_AGG (
                TO_JSONB (a.*) ||
                JSONB_BUILD_OBJECT (
                    'holdings', (
                        SELECT ARRAY_AGG (TO_JSONB (h.*))
                        FROM holdings_with_security h
                        WHERE h.account_id = a.id
                    )
                )
            ) as accounts
        FROM items i
        JOIN accounts a
            ON a.item_id = i.id
            AND a.active = TRUE
        WHERE i.user_id = $1
            AND i.active = TRUE
            AND EXISTS (
                SELECT 1
                FROM holdings h
                WHERE h.account_id = a.id
            )
        GROUP BY i.id
    `
    const rows = (
        await runQuery<DbItemWithAccountsWithHoldings>(query, [userId])
    ).rows
    return rows.map(mapDbItemWithAccountsWithHoldings)
}

export const fetchActiveItemsWithCreditCardAccounts = async (
    userId: number
): Promise<ItemWithCreditCardAccounts[]> => {
    const query = `
        WITH credit_card_accounts AS (
            SELECT
                a.*,
                c.aprs,
                c.overdue,
                c.last_payment_date,
                c.last_payment_amount,
                c.last_statement_date,
                c.last_statement_balance,
                c.next_payment_due_date,
                c.minimum_payment_amount
            FROM active_accounts a
            JOIN credit_cards c
                ON c.account_id = a.id
            WHERE a.active = TRUE
        )
        SELECT
            i.*,
            ARRAY_AGG (TO_JSONB (a.*)) as accounts
        FROM items i
        JOIN credit_card_accounts a
            ON a.item_id = i.id
        WHERE i.user_id = $1
            AND i.active = TRUE
        GROUP BY i.id
    `
    const rows = (await runQuery<DbItemWithCreditCardAccounts>(query, [userId]))
        .rows
    return rows.map(mapDbItemWithCreditCardAccounts)
}

export const fetchActiveItemsWithMortgageAccounts = async (
    userId: number
): Promise<ItemWithMortgageAccounts[]> => {
    const query = `
        WITH mortgage_accounts AS (
            SELECT
                a.*,
                m.type AS mortgage_type,
                m.interest_rate_type,
                m.interest_rate_percent,
                m.term,
                m.address,
                m.origination_date,
                m.origination_principal,
                m.maturity_date,
                m.late_fee,
                m.escrow_balance,
                m.prepayment_penalty,
                m.private_insurance,
                m.past_due_amount,
                m.last_payment_date,
                m.last_payment_amount,
                m.next_payment_due_date,
                m.next_payment_amount,
                m.ytd_interest_paid,
                m.ytd_principal_paid
            FROM active_accounts a
            JOIN mortgages m
                ON m.account_id = a.id
            WHERE a.active = TRUE
        )
        SELECT
            i.*,
            ARRAY_AGG (TO_JSONB (a.*)) as accounts
        FROM items i
        JOIN mortgage_accounts a
            ON a.item_id = i.id
        WHERE i.user_id = $1
            AND i.active = TRUE
        GROUP BY i.id
    `
    const rows = (await runQuery<DbItemWithMortgageAccounts>(query, [userId]))
        .rows
    return rows.map(mapDbItemWithMortgageAccounts)
}

export const fetchActiveItemsWithStudentsLoansAccounts = async (
    userId: number
): Promise<ItemWithStudentLoanAccounts[]> => {
    const query = `
        WITH student_loan_accounts AS (
            SELECT
                a.*,
                s.name AS student_loan_name,
                s.interest_rate_percent,
                s.status_type_id,
                s.status_end_date,
                s.overdue,
                s.origination_date,
                s.origination_principal,
                s.disbursement_dates,
                s.outstanding_interest,
                s.expected_payoff_date,
                s.guarantor,
                s.servicer_address,
                s.repayment_plan_type_id,
                s.repayment_plan_description,
                s.last_payment_date,
                s.last_payment_amount,
                s.last_statement_date,
                s.last_statement_balance,
                s.next_payment_due_date,
                s.minimum_payment_amount,
                s.ytd_interest_paid,
                s.ytd_principal_paid
            FROM active_accounts a
            JOIN student_loans s
                ON s.account_id = a.id
            WHERE a.active = TRUE
        )
        SELECT
            i.*,
            ARRAY_AGG (TO_JSONB (a.*)) as accounts
        FROM items i
        JOIN student_loan_accounts a
            ON a.item_id = i.id
        WHERE i.user_id = $1
            AND i.active = TRUE
        GROUP BY i.id
    `
    const rows = (
        await runQuery<DbItemWithStudentLoanAccounts>(query, [userId])
    ).rows
    return rows.map(mapDbItemWithStudentLoanAccounts)
}

export const fetchActiveItemByUserIdAndId = async (
    userId: number,
    itemId: number
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
            AND id = $2
        LIMIT 1
    `
    const rows = (await runQuery<DbItem>(query, [userId, itemId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const fetchActiveItemByUserIdAndInstitutionId = async (
    userId: number,
    institutionId: string
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
            AND institution_id = $2
        LIMIT 1
    `
    const rows = (await runQuery<DbItem>(query, [userId, institutionId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const modifyItemToInactiveById = async (id: number): Promise<void> => {
    const query = `
        UPDATE items
        SET active = false
        WHERE id = $1
    `
    await runQuery(query, [id])
}

export const modifyItemHealthyById = async (
    id: number,
    healthy: boolean
): Promise<void> => {
    const query = `
        UPDATE items
        SET healthy = $1
        WHERE id = $2
    `
    await runQuery(query, [healthy, id])
}

export const modifyItemLastRefreshedByPlaidId = async (
    plaidId: string,
    lastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [lastRefreshed, plaidId])
}

export const modifyItemTransactionsLastRefreshedByPlaidId = async (
    plaidId: string,
    transactionsLastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET transactions_last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [transactionsLastRefreshed, plaidId])
}

export const modifyItemInvestmentsLastRefreshedByPlaidId = async (
    plaidId: string,
    investmentsLastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET investments_last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [investmentsLastRefreshed, plaidId])
}

export const modifyItemCursorByPlaidId = async (
    plaidId: string,
    cursor: string | null
): Promise<void> => {
    const query = `
        UPDATE items
        SET cursor = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [cursor, plaidId])
}

/* eslint-disable @typescript-eslint/naming-convention */
interface DbItem {
    id: number
    user_id: number
    plaid_id: string
    active: boolean
    access_token: string
    institution_id: string
    institution_name: string
    healthy: boolean
    cursor: string | null
    last_refreshed: Date | null
    transactions_last_refreshed: Date | null
    investments_last_refreshed: Date | null
}
/* eslint-enable @typescript-eslint/naming-convention */

const mapDbItem = (dbItem: DbItem): Item => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    plaidId: dbItem.plaid_id,
    active: dbItem.active,
    accessToken: dbItem.access_token,
    institutionId: dbItem.institution_id,
    institutionName: dbItem.institution_name,
    healthy: dbItem.healthy,
    cursor: dbItem.cursor,
    lastRefreshed: dbItem.last_refreshed,
    transactionsLastRefreshed: dbItem.transactions_last_refreshed,
    investmentsLastRefreshed: dbItem.investments_last_refreshed,
})

interface DbItemWithAccounts extends DbItem {
    accounts: DbAccount[]
}

const mapDbItemWithAccounts = (
    dbItem: DbItemWithAccounts
): ItemWithAccounts => ({
    ...mapDbItem(dbItem),
    accounts: dbItem.accounts.map(mapDbAccount),
})

interface DbItemWithAccountsWithHoldings extends DbItem {
    accounts: DbAccountWithHoldings[]
}

const mapDbItemWithAccountsWithHoldings = (
    dbItem: DbItemWithAccountsWithHoldings
): ItemWithAccountsWithHoldings => ({
    ...mapDbItem(dbItem),
    accounts: dbItem.accounts.map(mapDbAccountWithHoldings),
})

interface DbItemWithCreditCardAccounts extends DbItem {
    accounts: DbCreditCardAccount[]
}

const mapDbItemWithCreditCardAccounts = (
    dbItem: DbItemWithCreditCardAccounts
): ItemWithCreditCardAccounts => ({
    ...mapDbItem(dbItem),
    accounts: dbItem.accounts.map(mapCreditCardAccount),
})

interface DbItemWithMortgageAccounts extends DbItem {
    accounts: DbMortgageAccount[]
}

const mapDbItemWithMortgageAccounts = (
    dbItem: DbItemWithMortgageAccounts
): ItemWithMortgageAccounts => ({
    ...mapDbItem(dbItem),
    accounts: dbItem.accounts.map(mapMortgageAccount),
})

interface DbItemWithStudentLoanAccounts extends DbItem {
    accounts: DbStudentLoanAccount[]
}

const mapDbItemWithStudentLoanAccounts = (
    dbItem: DbItemWithStudentLoanAccounts
): ItemWithStudentLoanAccounts => ({
    ...mapDbItem(dbItem),
    accounts: dbItem.accounts.map(mapStudentLoanAccount),
})
