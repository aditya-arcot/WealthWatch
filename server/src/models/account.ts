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

export const getAllAccounts = async (): Promise<Account[]> => {
    const query = 'SELECT * FROM accounts'
    const rows: DbAccount[] = (await runQuery(query)).rows
    return rows.map(mapDbAccountToAccount)
}
