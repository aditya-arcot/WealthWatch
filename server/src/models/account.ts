import { runQuery } from '../utils/database.js'

export interface Account {
    id: number
    itemId: number
    accountId: string
    name: string
    mask: string | null
    officialName: string | null
    currentBalance: number | null
    availableBalance: number | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    creditLimit: number | null
    type: string
    subtype: string | null
}

interface DbAccount {
    id: number
    item_id: number
    account_id: string
    name: string
    mask: string | null
    official_name: string | null
    current_balance: number | null
    available_balance: number | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
    credit_limit: number | null
    type: string
    subtype: string | null
}

const mapDbAccount = (dbAccount: DbAccount): Account => ({
    id: dbAccount.id,
    itemId: dbAccount.item_id,
    accountId: dbAccount.account_id,
    name: dbAccount.name,
    mask: dbAccount.mask,
    officialName: dbAccount.official_name,
    currentBalance: dbAccount.current_balance,
    availableBalance: dbAccount.available_balance,
    isoCurrencyCode: dbAccount.iso_currency_code,
    unofficialCurrencyCode: dbAccount.unofficial_currency_code,
    creditLimit: dbAccount.credit_limit,
    type: dbAccount.type,
    subtype: dbAccount.subtype,
})

export const retrieveAccountsByUser = async (
    userId: number
): Promise<Account[]> => {
    const query = `
        SELECT accounts.* 
        FROM accounts
        WHERE 
            accounts.item_id IN (
                SELECT id FROM items
                WHERE user_id = $1
            )
    `
    const rows: DbAccount[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbAccount)
}

export const createOrUpdateAccounts = async (accounts: Account[]) => {
    if (!accounts.length) return
    let query = `
        INSERT INTO accounts 
        (
            item_id, 
            account_id, 
            name, 
            mask, 
            official_name, 
            current_balance, 
            available_balance, 
            iso_currency_code, 
            unofficial_currency_code, 
            credit_limit, 
            type, 
            subtype
        ) 
        VALUES `
    const values: unknown[] = []
    accounts.forEach((account, idx) => {
        if (idx !== 0) query += ', '
        const startIdx = idx * 12
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
                $${startIdx + 12}
            )`
        values.push(
            account.itemId,
            account.accountId,
            account.name,
            account.mask,
            account.officialName,
            account.currentBalance,
            account.availableBalance,
            account.isoCurrencyCode,
            account.unofficialCurrencyCode,
            account.creditLimit,
            account.type,
            account.subtype
        )
    })
    query += `
        ON CONFLICT (account_id)
        DO UPDATE SET
            current_balance = EXCLUDED.current_balance,
            available_balance = EXCLUDED.available_balance,
            credit_limit = EXCLUDED.credit_limit
        RETURNING *
    `
    const rows: DbAccount[] = (await runQuery(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbAccount)
}
