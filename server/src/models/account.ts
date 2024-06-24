import { runQuery } from '../utils/database.js'
import { logger } from '../utils/logger.js'

export interface Account {
    id: number
    user_id: number
    name: string
}

export const getAllAccounts = async (): Promise<Account[]> => {
    logger.debug('getting all accounts')
    const query = 'SELECT * FROM accounts'
    const rows: Account[] = (await runQuery(query)).rows
    return rows
}
