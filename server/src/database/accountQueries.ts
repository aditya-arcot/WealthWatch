import { Account } from '../models/account.js'
import { runQuery } from './index.js'

export const insertAccounts = async (
    accounts: Account[]
): Promise<Account[] | undefined> => {
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
    const rows = (await runQuery<DbAccount>(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbAccount)
}

export const fetchActiveAccountsByUserId = async (
    userId: number
): Promise<Account[]> => {
    const query = `
        SELECT a.* 
        FROM accounts a
        WHERE 
            a.item_id IN (
                SELECT id 
                FROM active_items
                WHERE user_id = $1
            )
    `
    const rows = (await runQuery<DbAccount>(query, [userId])).rows
    return rows.map(mapDbAccount)
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

const mapDbAccount = (acc: DbAccount): Account => ({
    id: acc.id,
    itemId: acc.item_id,
    accountId: acc.account_id,
    name: acc.name,
    mask: acc.mask,
    officialName: acc.official_name,
    currentBalance: acc.current_balance,
    availableBalance: acc.available_balance,
    isoCurrencyCode: acc.iso_currency_code,
    unofficialCurrencyCode: acc.unofficial_currency_code,
    creditLimit: acc.credit_limit,
    type: acc.type,
    subtype: acc.subtype,
})
