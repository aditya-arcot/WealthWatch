import { runQuery } from '../utils/database.js'

export interface Account {
    id: number
    userId: number
    name: string
}

interface DbAccount {
    id: number
    user_id: number
    name: string
}

const mapDbAccountToAccount = (dbAccount: DbAccount): Account => ({
    id: dbAccount.id,
    userId: dbAccount.user_id,
    name: dbAccount.name,
})

export const fetchAccountsByUser = async (
    userId: number
): Promise<Account[]> => {
    const query = 'SELECT * FROM accounts WHERE user_id = $1'
    const rows: DbAccount[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbAccountToAccount)
}
