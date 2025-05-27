import {
    PaymentChannelEnum,
    Transaction,
    TransactionsAndCounts,
} from 'wealthwatch-shared'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertTransactions = async (
    transactions: Transaction[]
): Promise<void> => {
    if (!transactions.length) return

    const values: unknown[] = []
    transactions.forEach((transaction) => {
        values.push(
            transaction.accountId,
            transaction.plaidId,
            transaction.name,
            transaction.customName,
            transaction.amount,
            transaction.primaryCategory,
            transaction.detailedCategory,
            transaction.categoryId,
            transaction.customCategoryId,
            transaction.paymentChannel,
            transaction.merchantId,
            transaction.merchant,
            transaction.location,
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
            name,
            custom_name,
            amount,
            primary_category,
            detailed_category,
            category_id,
            custom_category_id,
            payment_channel,
            merchant_id,
            merchant,
            location,
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
    `

    await runQuery(query, values)
}

export const fetchPaginatedActiveTransactionsAndCountsByUserIdAndFilters =
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
    ): Promise<TransactionsAndCounts> => {
        const totalCount = await fetchActiveTransactionsCountByUserId(userId)

        const {
            filtered,
            query: initialQuery,
            values,
            placeholder,
        } = constructFetchActiveTransactionsByUserIdAndFiltersQuery(
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
                await fetchActiveTransactionsCountByUserIdAndFilters(
                    initialQuery,
                    values
                )
        }

        let query = initialQuery
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

const fetchActiveTransactionsCountByUserId = async (
    userId: number
): Promise<number> => {
    const query = `
        SELECT COUNT(*)::INT
        FROM active_transactions
        WHERE user_id = $1
    `
    const rows = (await runQuery<{ count: number }>(query, [userId])).rows
    if (!rows[0]) return -1
    const count = rows[0].count
    return isNaN(count) ? -1 : count
}

const constructFetchActiveTransactionsByUserIdAndFiltersQuery = (
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
        SELECT *
        FROM active_transactions
        WHERE user_id = $${placeholder}
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
                    custom_name,
                    merchant,
                    name
                )
            ) LIKE $${placeholder}
        `
        values.push(`%${modifiedSearchQuery}%`)
        placeholder++
    }

    if (startDate !== undefined && endDate !== undefined) {
        filtered = true
        query += `
            AND date >= $${placeholder}
            AND date < ($${placeholder + 1}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(startDate)
        values.push(endDate)
        placeholder += 2
    } else if (startDate !== undefined) {
        filtered = true
        query += `
            AND date >= $${placeholder}
        `
        values.push(startDate)
        placeholder++
    } else if (endDate !== undefined) {
        filtered = true
        query += `
            AND date < ($${placeholder}::TIMESTAMPTZ + INTERVAL '1 day')
        `
        values.push(endDate)
        placeholder++
    }

    if (minAmount !== undefined && maxAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(amount) >= $${placeholder} AND ABS(amount) <= $${placeholder + 1}
        `
        values.push(minAmount)
        values.push(maxAmount)
        placeholder += 2
    } else if (minAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(amount) >= $${placeholder}
        `
        values.push(minAmount)
        placeholder++
    } else if (maxAmount !== undefined) {
        filtered = true
        query += `
            AND ABS(amount) <= $${placeholder}
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
                custom_category_id,
                category_id
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
            AND account_id IN (${idsPlaceholder})
        `
        values.push(...accountIds)
        placeholder += accountIds.length
    }

    return { filtered, query, values, placeholder }
}

const fetchActiveTransactionsCountByUserIdAndFilters = async (
    mainQuery: string,
    values: unknown[]
) => {
    const query = `
        SELECT COUNT(*)::INT
        FROM (${mainQuery})
    `
    const rows = (await runQuery<{ count: number }>(query, values)).rows
    if (!rows[0]) return -1
    const count = rows[0].count
    return isNaN(count) ? -1 : count
}

export const fetchActiveTransactionsDateSeriesByUserIdAndDateRange = async (
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<Date[]> => {
    const values: unknown[] = []

    let query = `
        WITH user_transactions AS (
            SELECT date
            FROM active_transactions
            WHERE user_id = $1
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

export const modifyTransactionCustomNameByPlaidId = async (
    plaidId: string,
    name: string | null
): Promise<void> => {
    const query = `
        UPDATE transactions
        SET custom_name = $2
        WHERE plaid_id = $1
    `
    await runQuery(query, [plaidId, name])
}

export const modifyTransactionCustomCategoryIdByPlaidId = async (
    plaidId: string,
    categoryId: number | null
): Promise<void> => {
    const query = `
        UPDATE transactions
        SET custom_category_id = $2
        WHERE plaid_id = $1
    `
    await runQuery(query, [plaidId, categoryId])
}

export const modifyTransactionNoteByPlaidId = async (
    plaidId: string,
    note: string | null
): Promise<void> => {
    const query = `
        UPDATE transactions
        SET note = $2
        WHERE plaid_id = $1
    `
    await runQuery(query, [plaidId, note])
}

export const removeTransactionsByPlaidIds = async (
    plaidIds: string[]
): Promise<void> => {
    if (!plaidIds.length) return
    const query = `
        DELETE FROM transactions
        WHERE plaid_id IN
            (${plaidIds.map((_id, idx) => `$${idx + 1}`).join(', ')})
    `
    await runQuery(query, plaidIds)
}

/* eslint-disable @typescript-eslint/naming-convention */
interface DbTransaction {
    id: number
    account_id: number
    plaid_id: string
    name: string
    custom_name: string | null
    amount: number
    primary_category: string | null
    detailed_category: string | null
    category_id: number
    custom_category_id: number | null
    payment_channel: PaymentChannelEnum
    merchant_id: string | null
    merchant: string | null
    location: string | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
    date: Date
    pending: boolean
    note: string | null
}
/* eslint-enable @typescript-eslint/naming-convention */

const mapDbTransaction = (dbTransaction: DbTransaction): Transaction => ({
    id: dbTransaction.id,
    accountId: dbTransaction.account_id,
    plaidId: dbTransaction.plaid_id,
    name: dbTransaction.name,
    customName: dbTransaction.custom_name,
    amount: dbTransaction.amount,
    primaryCategory: dbTransaction.primary_category,
    detailedCategory: dbTransaction.detailed_category,
    categoryId: dbTransaction.category_id,
    customCategoryId: dbTransaction.custom_category_id,
    paymentChannel: dbTransaction.payment_channel,
    merchantId: dbTransaction.merchant_id,
    merchant: dbTransaction.merchant,
    location: dbTransaction.location,
    isoCurrencyCode: dbTransaction.iso_currency_code,
    unofficialCurrencyCode: dbTransaction.unofficial_currency_code,
    date: dbTransaction.date,
    pending: dbTransaction.pending,
    note: dbTransaction.note,
})
