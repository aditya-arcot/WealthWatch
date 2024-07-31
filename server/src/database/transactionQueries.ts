import { Transaction } from '../models/transaction.js'
import { runQuery } from './index.js'

export const insertTransactions = async (
    transactions: Transaction[]
): Promise<Transaction[] | undefined> => {
    if (!transactions.length) return
    let query = `
        INSERT INTO transactions (
            account_id, 
            transaction_id, 
            name, 
            amount, 
            merchant, 
            merchant_id, 
            category,
            detailed_category,
            payment_channel,
            iso_currency_code, 
            unofficial_currency_code, 
            date, 
            pending
        ) 
        VALUES `
    const values: unknown[] = []
    transactions.forEach((transaction, idx) => {
        if (idx !== 0) query += ', '
        const startIdx = idx * 13
        query += `(
                $${startIdx + 1}, 
                $${startIdx + 2}, 
                $${startIdx + 3}, 
                $${startIdx + 4}, 
                $${startIdx + 5}, 
                $${startIdx + 6}, 
                $${startIdx + 7}, 
                $${startIdx + 8}, 
                $${startIdx + 9}, 
                $${startIdx + 10}, 
                $${startIdx + 11}, 
                $${startIdx + 12}, 
                $${startIdx + 13}
            )`
        values.push(
            transaction.accountId,
            transaction.transactionId,
            transaction.name,
            transaction.amount,
            transaction.merchant,
            transaction.merchantId,
            transaction.category,
            transaction.detailedCategory,
            transaction.paymentChannel,
            transaction.isoCurrencyCode,
            transaction.unofficialCurrencyCode,
            transaction.date,
            transaction.pending
        )
    })
    query += `
        ON CONFLICT (transaction_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            amount = EXCLUDED.amount,
            merchant = EXCLUDED.merchant,
            merchant_id = EXCLUDED.merchant_id,
            category = EXCLUDED.category,
            detailed_category = EXCLUDED.detailed_category,
            payment_channel = EXCLUDED.payment_channel,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code,
            date = EXCLUDED.date,
            pending = EXCLUDED.pending
        RETURNING *
    `
    const rows: DbTransaction[] = (await runQuery(query, values)).rows
    return rows.map(mapDbTransaction)
}

export const fetchTransactionsByUserId = async (
    userId: number
): Promise<Transaction[]> => {
    const query = `
        SELECT t.*
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
        ORDER BY date DESC
    `
    const rows: DbTransaction[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbTransaction)
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
    const rows: DbTransaction[] = (await runQuery(query, transactionIds)).rows
    return rows.map(mapDbTransaction)
}

interface DbTransaction {
    id: number
    account_id: number
    transaction_id: string
    name: string
    amount: number
    merchant: string | null
    merchant_id: string | null
    category: string | null
    detailed_category: string | null
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
    name: dbTransaction.name,
    amount: dbTransaction.amount,
    merchant: dbTransaction.merchant,
    merchantId: dbTransaction.merchant_id,
    category: dbTransaction.category,
    detailedCategory: dbTransaction.detailed_category,
    paymentChannel: dbTransaction.payment_channel,
    isoCurrencyCode: dbTransaction.iso_currency_code,
    unofficialCurrencyCode: dbTransaction.unofficial_currency_code,
    date: dbTransaction.date,
    pending: dbTransaction.pending,
})
