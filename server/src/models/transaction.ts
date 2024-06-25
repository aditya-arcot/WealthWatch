import { runQuery } from '../utils/database.js'

export interface Transaction {
    id: number
    account_id: number
    category_id: number
    amount: number
    description: string
    timestamp: Date
}

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const query = 'SELECT * FROM transactions'
    const rows: Transaction[] = (await runQuery(query)).rows
    return rows
}
