import { runQuery } from '../utils/database.js'

export interface Transaction {
    id: number
    accountId: number
    transactionId: string
    name: string
    amount: number
    merchant: string | null
    merchantId: string | null
    category: string | null
    detailedCategory: string | null
    paymentChannel: string
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
}

export const createOrUpdateTransactions = async (
    transactions: Transaction[]
) => {
    if (!transactions.length) return
    let query = `
        INSERT INTO transactions 
        (
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
    `
    await runQuery(query, values)
}

export const deleteTransactions = async (transactionIds: string[]) => {
    if (!transactionIds.length) return
    const query = `
        DELETE FROM transactions
        WHERE transaction_id IN (${transactionIds.map((_id, idx) => `$${idx + 1}`).join(', ')})
    `
    await runQuery(query, transactionIds)
}
