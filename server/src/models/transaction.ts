import { runQuery } from '../utils/database.js'

export interface Transaction {
    id: number
    accountId: number
    categoryId: number
    amount: number
    description: string
    nickname: string
    timestamp: Date
}

interface DbTransaction {
    id: number
    account_id: number
    category_id: number
    amount: number
    description: string
    nickname: string
    timestamp: Date
}

const mapDbTransactionToTransaction = (
    dbTransaction: DbTransaction
): Transaction => ({
    id: dbTransaction.id,
    accountId: dbTransaction.account_id,
    categoryId: dbTransaction.category_id,
    amount: dbTransaction.amount,
    description: dbTransaction.description,
    nickname: dbTransaction.nickname,
    timestamp: dbTransaction.timestamp,
})

export const fetchTransactionsByUser = async (
    userId: number
): Promise<Transaction[]> => {
    const query = `
        SELECT * FROM transactions
        JOIN accounts ON transactions.account_id = accounts.id
        WHERE accounts.user_id = $1
    `
    const rows: DbTransaction[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbTransactionToTransaction)
}
