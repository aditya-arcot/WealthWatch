import { runQuery } from '../utils/database.js'

export interface Account {
    id: number
    user_id: number
    name: string
}

export const getAllAccounts = async (): Promise<Account[]> => {
    const query = 'SELECT * FROM accounts'
    const rows: Account[] = (await runQuery(query)).rows
    return rows
}
