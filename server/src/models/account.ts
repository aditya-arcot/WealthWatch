import { runQuery } from '../utils/database.js'

export interface Account {
    id: string
    name: string
    itemId: string
    mask: string | null
    type: string
    subtype: string
}

interface DbAccount {
    id: string
    name: string
    item_id: string
    mask: string | null
    type: string
    subtype: string
}

const mapDbAccount = (dbAccount: DbAccount): Account => ({
    id: dbAccount.id,
    name: dbAccount.name,
    itemId: dbAccount.item_id,
    mask: dbAccount.mask,
    type: dbAccount.type,
    subtype: dbAccount.subtype,
})

export interface AccountWithInstitution extends Account {
    institutionId: string
}

interface DbAccountWithInstitution extends DbAccount {
    institution_id: string
}

const mapDbAccountWithInstitutionId = (
    dbAccount: DbAccountWithInstitution
): AccountWithInstitution => ({
    ...mapDbAccount(dbAccount),
    institutionId: dbAccount.institution_id,
})

export const fetchAccountsByUser = async (
    userId: number
): Promise<Account[]> => {
    const query = `
        SELECT * FROM accounts
        WHERE accounts.item_id IN (
            SELECT id FROM items
            WHERE user_id = $1
        )
    `
    const rows: DbAccount[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbAccount)
}

export const fetchAccountsWithInstitutionByUser = async (
    userId: number
): Promise<AccountWithInstitution[]> => {
    const query = `
        SELECT *
        FROM accounts
        JOIN items ON accounts.item_id = items.id
        WHERE accounts.item_id IN (
            SELECT id FROM items
            WHERE user_id = $1
        )
    `
    const rows: DbAccountWithInstitution[] = (await runQuery(query, [userId]))
        .rows
    return rows.map(mapDbAccountWithInstitutionId)
}

export const createAccounts = async (accounts: Account[]) => {
    if (!accounts.length) return
    let query =
        'INSERT INTO accounts (id, name, item_id, mask, type, subtype) VALUES '
    const values: (string | number | null)[] = []
    accounts.forEach((account, idx) => {
        if (idx !== 0) query += ', '
        const startIdx = idx * 6
        query += `($${startIdx + 1}, $${startIdx + 2}, $${startIdx + 3}, $${startIdx + 4}, $${startIdx + 5}, $${startIdx + 6})`
        values.push(
            account.id,
            account.name,
            account.itemId,
            account.mask,
            account.type,
            account.subtype
        )
    })
    await runQuery(query, values)
}
