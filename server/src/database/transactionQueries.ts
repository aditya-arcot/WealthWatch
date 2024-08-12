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

const fetchTotalActiveTransactionsByUserId = async (
    userId: number
): Promise<number | undefined> => {
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
    if (!rows[0]) return
    const countNum = parseInt(rows[0].count)
    return isNaN(countNum) ? undefined : countNum
}

export const fetchActiveTransactionsByUserId = async (
    userId: number,
    searchQuery?: string,
    limit?: number,
    offset?: number
): Promise<TransactionsResponse> => {
    const total = (await fetchTotalActiveTransactionsByUserId(userId)) ?? -1

    let placeholder = 1
    const values: unknown[] = []

    // main query
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
            )`
    values.push(userId)
    placeholder++

    // search
    if (searchQuery) {
        query += `
            AND (
                LOWER(t.custom_name) LIKE $${placeholder} OR
                LOWER(t.merchant) LIKE $${placeholder} OR
                LOWER(t."name") LIKE $${placeholder}
            )
        `
        values.push(`%${searchQuery.toLowerCase()}%`)
        placeholder++
    }

    // sort
    query += `
        ORDER BY t.date DESC, t.transaction_id
    `

    // limit
    if (limit) {
        query += `
            LIMIT $${placeholder}
        `
        values.push(limit)
        placeholder++

        // offset
        if (offset) {
            query += `
                OFFSET $${placeholder}
            `
            values.push(offset)
            placeholder++
        }
    }

    const rows = (await runQuery<DbTransaction>(query, values)).rows
    return {
        transactions: rows.map(mapDbTransaction),
        searchQuery: searchQuery ?? null,
        limit: limit ?? null,
        offset: limit ? (offset ?? null) : null,
        total,
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
