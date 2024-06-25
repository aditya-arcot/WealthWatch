import { runQuery } from '../utils/database.js'

export interface Transaction {
    id: number
    accountId: number
    categoryId: number
    amount: number
    description: string
    timestamp: Date
}

interface DbTransaction {
    id: number
    account_id: number
    category_id: number
    amount: number
    description: string
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
    timestamp: dbTransaction.timestamp,
})

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const query = 'SELECT * FROM transactions'
    const rows: DbTransaction[] = (await runQuery(query)).rows
    return rows.map(mapDbTransactionToTransaction)
}
