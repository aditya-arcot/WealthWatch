import { Account } from '../models/account.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertAccounts = async (
    accounts: Account[],
    updateBalances = false
): Promise<void> => {
    if (!accounts.length) return

    const values: unknown[] = []
    accounts.forEach((account) => {
        values.push(
            account.itemId,
            account.plaidId,
            account.active,
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

    const rowCount = accounts.length
    const paramCount = Math.floor(values.length / rowCount)
    let query = `
        INSERT INTO accounts
        (
            item_id,
            plaid_id,
            active,
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
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (plaid_id)
        DO UPDATE SET
            active = EXCLUDED.active,
            name = EXCLUDED.name,
            mask = EXCLUDED.mask,
            official_name = EXCLUDED.official_name,
        `
    if (updateBalances) {
        query += `
            current_balance = EXCLUDED.current_balance,
            available_balance = EXCLUDED.available_balance,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code,
            credit_limit = EXCLUDED.credit_limit,
        `
    }
    query += `
            type = EXCLUDED.type,
            subtype = EXCLUDED.subtype
    `

    await runQuery(query, values)
}

export const fetchActiveAccountsByUserId = async (
    userId: number
): Promise<Account[]> => {
    const query = `
        SELECT *
        FROM active_accounts
        WHERE user_id = $1
    `
    const rows = (await runQuery<DbAccount>(query, [userId])).rows
    return rows.map(mapDbAccount)
}

export const modifyAccountsToInactiveByPlaidItemId = async (
    plaidItemId: string
): Promise<void> => {
    const query = `
        UPDATE accounts a
        SET active = false
        FROM active_items ai
        WHERE ai.id = a.item_id 
            and ai.plaid_id = $1
    `
    await runQuery(query, [plaidItemId])
}

interface DbAccount {
    id: number
    item_id: number
    plaid_id: string
    active: boolean
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
    plaidId: acc.plaid_id,
    active: acc.active,
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
