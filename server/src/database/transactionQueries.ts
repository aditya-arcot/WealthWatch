import { Transaction, TransactionsWithCounts } from '../models/transaction.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertTransactions = async (
    transactions: Transaction[]
): Promise<Transaction[] | undefined> => {
    if (!transactions.length) return

    const values: unknown[] = []
    transactions.forEach((transaction) => {
        values.push(
            transaction.accountId,
            transaction.plaidId,
            transaction.merchantId,
            transaction.merchant,
            transaction.name,
            transaction.customName,
            transaction.amount,
            transaction.primaryCategory,
            transaction.detailedCategory,
            transaction.categoryId,
            transaction.customCategoryId,
            transaction.paymentChannel,
            transaction.isoCurrencyCode,
            transaction.unofficialCurrencyCode,
            transaction.date,
            transaction.pending,
            transaction.note
        )
    })

    const rowCount = transactions.length
    const paramCount = Math.floor(values.length / rowCount)
    // preserve custom name, custom category id
    const query = `
        INSERT INTO transactions (
            account_id,
            plaid_id,
            merchant_id,
            merchant,
            name,
            custom_name,
            amount,
            primary_category,
            detailed_category,
            category_id,
            custom_category_id,
            payment_channel,
            iso_currency_code,
            unofficial_currency_code,
            date,
            pending,
            note
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (plaid_id)
        DO UPDATE SET
            merchant_id = EXCLUDED.merchant_id,
            merchant = EXCLUDED.merchant,
            name = EXCLUDED.name,
            amount = EXCLUDED.amount,
            primary_category = EXCLUDED.primary_category,
            detailed_category = EXCLUDED.detailed_category,
            category_id = EXCLUDED.category_id,
            payment_channel = EXCLUDED.payment_channel,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code,
            date = EXCLUDED.date,
            pending = EXCLUDED.pending
        RETURNING *
    `

    const rows = (await runQuery<DbTransaction>(query, values)).rows
    return rows.map(mapDbTransaction)
}

export const fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters =
    async (
        userId: number,
        searchQuery?: string,
        startDate?: string,
        endDate?: string,
        minAmount?: number,
        maxAmount?: number,
        categoryIds?: number[],
        accountIds?: number[],
        limit?: number,
        offset?: number
    ): Promise<TransactionsWithCounts> => {
        const totalCount = await fetchActiveTransactionsCountWithUserId(userId)

        const {
            filtered,
            query: initialQuery,
            values,
            placeholder,
        } = constructFetchActiveTransactionsWithUserIdAndFiltersQuery(
            userId,
            searchQuery,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            categoryIds,
            accountIds
        )

        let filteredCount: number | null = null
        if (filtered) {
            filteredCount =
                await fetchActiveTransactionsCountWithUserIdAndFilters(
                    initialQuery,
                    values
                )
        }

        let query =
            initialQuery +
            `
        ORDER BY t.date DESC, t.plaid_id
    `
        if (limit !== undefined) {
            query += `
            LIMIT $${placeholder}
        `
            values.push(limit)

            if (offset !== undefined) {
                query += `
                OFFSET $${placeholder + 1}
            `
                values.push(offset)
            }
        }
        const rows = (await runQuery<DbTransaction>(query, values)).rows

        return {
            transactions: rows.map(mapDbTransaction),
            filteredCount,
            totalCount,
        }
    }

const fetchActiveTransactionsCountWithUserId = async (
    userId: number
): Promise<number> => {
    const query = `
        SELECT COUNT(*)::INT
        FROM transactions t
        WHERE
            t.account_id IN (
                SELECT id
                FROM accounts
                WHERE item_id IN (
                    SELECT id
                    FROM active_items
                    WHERE user_id = $1
                )
            )
    `
    const rows = (await runQuery<{ count: number }>(query, [userId])).rows
    if (!rows[0]) return -1
    const count = rows[0].count
    return isNaN(count) ? -1 : count
}

const constructFetchActiveTransactionsWithUserIdAndFiltersQuery = (
    userId: number,
    searchQuery?: string,
    startDate?: string,
    endDate?: string,
    minAmount?: number,
    maxAmount?: number,
    categoryIds?: number[],
    accountIds?: number[]
) => {
    let placeholder = 1
    const values: unknown[] = []

    let query = `
        SELECT t.*
        FROM transactions t
        WHERE
            t.account_id IN (
                SELECT id
                FROM accounts
                WHERE item_id IN (
                    SELECT id
                    FROM active_items
                    WHERE user_id = $${placeholder}
                )
            )
    `
    values.push(userId)
    placeholder++

    let filtered = false

    const modifiedSearchQuery = searchQuery?.trim().toLowerCase()
    if (modifiedSearchQuery !== undefined && modifiedSearchQuery !== '') {
        filtered = true
        query += `
            AND LOWER (
                COALESCE (
                    t.custom_name,
                    t.merchant,
                    t.name
                )
            ) LIKE $${placeholder}
        `
        values.push(`%${modifiedSearchQuery}%`)
        placeholder++
    }

    if (startDate !== undefined && endDate !== undefined) {
        filtered = true
        query += `
            AND t.date >= $${placeholder}
            AND t.date < ($${placeholder + 1}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(startDate)
        values.push(endDate)
        placeholder += 2
    } else if (startDate !== undefined) {
        filtered = true
        query += `
            AND t.date >= $${placeholder}
        `
        values.push(startDate)
        placeholder++
    } else if (endDate !== undefined) {
        filtered = true
        query += `
            AND t.date < ($${placeholder}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(endDate)
        placeholder++
    }

    if (minAmount !== undefined && maxAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(t.amount) >= $${placeholder} AND ABS(t.amount) <= $${placeholder + 1}
        `
        values.push(minAmount)
        values.push(maxAmount)
        placeholder += 2
    } else if (minAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(t.amount) >= $${placeholder}
        `
        values.push(minAmount)
        placeholder++
    } else if (maxAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(t.amount) <= $${placeholder}
        `
        values.push(maxAmount)
        placeholder++
    }

    if (categoryIds !== undefined && categoryIds.length > 0) {
        filtered = true
        const idsPlaceholder = categoryIds
            .map((_, idx) => `$${idx + placeholder}`)
            .join(', ')
        query += `
            AND COALESCE (
                t.custom_category_id, 
                t.category_id
            ) IN (${idsPlaceholder})
        `
        values.push(...categoryIds)
        placeholder += categoryIds.length
    }

    if (accountIds !== undefined && accountIds.length > 0) {
        filtered = true
        const idsPlaceholder = accountIds
            .map((_, idx) => `$${idx + placeholder}`)
            .join(', ')
        query += `
            AND t.account_id IN (${idsPlaceholder})
        `
        values.push(...accountIds)
        placeholder += accountIds.length
    }

    return { filtered, query, values, placeholder }
}

const fetchActiveTransactionsCountWithUserIdAndFilters = async (
    mainQuery: string,
    values: unknown[]
) => {
    const query = `
        SELECT COUNT(*)::INT
        FROM (${mainQuery}) AS t
    `
    const rows = (await runQuery<{ count: number }>(query, values)).rows
    if (!rows[0]) return -1
    const count = rows[0].count
    return isNaN(count) ? -1 : count
}

export const fetchActiveTransactionsDailyDateRangeWithUserIdAndDates = async (
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<Date[]> => {
    const values: unknown[] = []

    let query = `
        WITH user_transactions AS (
            SELECT
                COALESCE (
                    custom_category_id,
                    category_id
                ) AS category_id,
                date,
                amount
            FROM transactions
            WHERE account_id IN (
                SELECT id
                FROM accounts
                WHERE item_id IN (
                    SELECT id
                    FROM active_items
                    WHERE user_id = $1
                )
            )
        ),
        date_series AS (
            SELECT GENERATE_SERIES (
    `
    values.push(userId)

    if (startDate === undefined && endDate === undefined) {
        query += `
                (SELECT MIN (date) FROM user_transactions),
                (SELECT MAX (date) FROM user_transactions),
        `
    } else if (startDate === undefined) {
        query += `
                DATE_TRUNC ('day', (SELECT MIN (date) FROM user_transactions))
                    - INTERVAL '1 day'
                    + ($2::TIMESTAMPTZ - DATE_TRUNC ('day', $2::TIMESTAMPTZ)),
                $2::TIMESTAMPTZ,
        `
        values.push(endDate)
    } else if (endDate === undefined) {
        query += `
                $2::TIMESTAMPTZ,
                NOW (),
        `
        values.push(startDate)
    } else {
        query += `
                $2::TIMESTAMPTZ,
                $3::TIMESTAMPTZ,
        `
        values.push(startDate)
        values.push(endDate)
    }

    query += `
                INTERVAL '1 day'
            ) AS date
        )
        SELECT date
        FROM date_series
        ORDER BY date
    `
    const rows = (await runQuery<{ date: Date }>(query, values)).rows
    return rows.map((row) => row.date)
}

export const modifyTransactionCustomNameWithPlaidId = async (
    plaidId: string,
    name: string | null
): Promise<Transaction | undefined> => {
    const query = `
        UPDATE transactions
        SET custom_name = $2
        WHERE plaid_id = $1
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, [plaidId, name])).rows
    if (!rows[0]) return
    return mapDbTransaction(rows[0])
}

export const modifyTransactionCustomCategoryIdWithPlaidId = async (
    plaidId: string,
    categoryId: number | null
): Promise<Transaction | undefined> => {
    const query = `
        UPDATE transactions
        SET custom_category_id = $2
        WHERE plaid_id = $1
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, [plaidId, categoryId]))
        .rows
    if (!rows[0]) return
    return mapDbTransaction(rows[0])
}

export const modifyTransactionNoteWithPlaidId = async (
    plaidId: string,
    note: string | null
): Promise<Transaction | undefined> => {
    const query = `
        UPDATE transactions
        SET note = $2
        WHERE plaid_id = $1
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, [plaidId, note])).rows
    if (!rows[0]) return
    return mapDbTransaction(rows[0])
}

export const removeTransactionsWithPlaidIds = async (
    plaidIds: string[]
): Promise<Transaction[] | undefined> => {
    if (!plaidIds.length) return
    const query = `
        DELETE FROM transactions
        WHERE plaid_id IN
            (${plaidIds.map((_id, idx) => `$${idx + 1}`).join(', ')})
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, plaidIds)).rows
    return rows.map(mapDbTransaction)
}

interface DbTransaction {
    id: number
    account_id: number
    plaid_id: string
    merchant_id: string | null
    merchant: string | null
    name: string
    custom_name: string | null
    amount: number
    primary_category: string | null
    detailed_category: string | null
    category_id: number
    custom_category_id: number | null
    payment_channel: string
    iso_currency_code: string | null
    unofficial_currency_code: string | null
    date: Date
    pending: boolean
    note: string | null
}

const mapDbTransaction = (dbTransaction: DbTransaction): Transaction => ({
    id: dbTransaction.id,
    accountId: dbTransaction.account_id,
    plaidId: dbTransaction.plaid_id,
    merchantId: dbTransaction.merchant_id,
    merchant: dbTransaction.merchant,
    name: dbTransaction.name,
    customName: dbTransaction.custom_name,
    amount: dbTransaction.amount,
    primaryCategory: dbTransaction.primary_category,
    detailedCategory: dbTransaction.detailed_category,
    categoryId: dbTransaction.category_id,
    customCategoryId: dbTransaction.custom_category_id,
    paymentChannel: dbTransaction.payment_channel,
    isoCurrencyCode: dbTransaction.iso_currency_code,
    unofficialCurrencyCode: dbTransaction.unofficial_currency_code,
    date: dbTransaction.date,
    pending: dbTransaction.pending,
    note: dbTransaction.note,
})
