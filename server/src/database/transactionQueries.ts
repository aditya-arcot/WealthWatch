import { Transaction, TransactionsResponse } from '../models/transaction.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertTransactions = async (
    transactions: Transaction[]
): Promise<Transaction[] | undefined> => {
    if (!transactions.length) return

    const values: unknown[] = []
    transactions.forEach((transaction) => {
        values.push(
            transaction.accountId,
            transaction.transactionId,
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
            transaction.pending
        )
    })

    const rowCount = transactions.length
    const paramCount = Math.floor(values.length / rowCount)
    // preserve custom name, custom category id
    const query = `
        INSERT INTO transactions (
            account_id,
            transaction_id,
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
            pending
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (transaction_id)
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

const fetchActiveTransactionsByUserIdCount = async (
    userId: number
): Promise<number> => {
    const query = `
        SELECT COUNT(*)
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
    const rows = (await runQuery<{ count: string }>(query, [userId])).rows
    if (!rows[0]) return -1
    const countNum = parseInt(rows[0].count)
    return isNaN(countNum) ? -1 : countNum
}

export const fetchActiveTransactionsByUserId = async (
    userId: number,
    searchQuery?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number
): Promise<TransactionsResponse> => {
    const totalCount = await fetchActiveTransactionsByUserIdCount(userId)

    let placeholder = 1
    const values: unknown[] = []

    let baseQuery = `
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
    if (searchQuery) {
        filtered = true
        baseQuery += `
            AND LOWER (
                COALESCE (
                    t.custom_name,
                    t.merchant,
                    t.name
                )
            ) LIKE $${placeholder}
        `
        values.push(`%${searchQuery.toLowerCase()}%`)
        placeholder++
    }

    if (startDate && endDate) {
        filtered = true
        baseQuery += `
            AND t.date BETWEEN $${placeholder} AND $${placeholder + 1}
        `
        values.push(startDate)
        values.push(endDate)
        placeholder += 2
    } else if (startDate) {
        filtered = true
        baseQuery += `
            AND t.date >= $${placeholder}
        `
        values.push(startDate)
        placeholder++
    } else if (endDate) {
        filtered = true
        baseQuery += `
            AND t.date <= $${placeholder}
        `
        values.push(endDate)
        placeholder++
    }

    let filteredCount: number | null = null
    if (filtered) {
        const countQuery = `
            SELECT COUNT(*)
            FROM (${baseQuery}) AS t
        `
        const countRows = (
            await runQuery<{ count: string }>(countQuery, values)
        ).rows
        if (!countRows[0]) throw Error('failed to fetch count')
        const countNum = parseInt(countRows[0].count)
        filteredCount = isNaN(countNum) ? -1 : countNum
    }

    let mainQuery = baseQuery
    mainQuery += `
        ORDER BY t.date DESC, t.transaction_id
    `

    if (limit) {
        mainQuery += `
            LIMIT $${placeholder}
        `
        values.push(limit)
        placeholder++

        if (offset) {
            mainQuery += `
                OFFSET $${placeholder}
            `
            values.push(offset)
            placeholder++
        }
    }

    const rows = (await runQuery<DbTransaction>(mainQuery, values)).rows
    return {
        totalCount,
        filteredCount,
        transactions: rows.map(mapDbTransaction),
    }
}

export const updateTransactionCustomNameById = async (
    transactionId: string,
    name: string | null
): Promise<Transaction | undefined> => {
    const query = `
        UPDATE transactions
        SET custom_name = $2
        WHERE transaction_id = $1
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, [transactionId, name]))
        .rows
    if (!rows[0]) return
    return mapDbTransaction(rows[0])
}

export const updateTransactionCustomCategoryIdById = async (
    transactionId: string,
    categoryId: number | null
): Promise<Transaction | undefined> => {
    const query = `
        UPDATE transactions
        SET custom_category_id = $2
        WHERE transaction_id = $1
        RETURNING *
    `
    const rows = (
        await runQuery<DbTransaction>(query, [transactionId, categoryId])
    ).rows
    if (!rows[0]) return
    return mapDbTransaction(rows[0])
}

export const removeTransactionsByTransactionIds = async (
    transactionIds: string[]
): Promise<Transaction[] | undefined> => {
    if (!transactionIds.length) return
    const query = `
        DELETE FROM transactions
        WHERE transaction_id IN
            (${transactionIds.map((_id, idx) => `$${idx + 1}`).join(', ')})
        RETURNING *
    `
    const rows = (await runQuery<DbTransaction>(query, transactionIds)).rows
    return rows.map(mapDbTransaction)
}

interface DbTransaction {
    id: number
    account_id: number
    transaction_id: string
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
}

const mapDbTransaction = (dbTransaction: DbTransaction): Transaction => ({
    id: dbTransaction.id,
    accountId: dbTransaction.account_id,
    transactionId: dbTransaction.transaction_id,
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
})
