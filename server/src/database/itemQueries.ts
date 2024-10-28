import { Item } from '../models/item.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertItem = async (item: Item): Promise<Item | undefined> => {
    const values: unknown[] = [
        item.userId,
        item.plaidId,
        item.active,
        item.accessToken,
        item.institutionId,
        item.institutionName,
        item.healthy,
        item.cursor,
        item.lastRefreshed,
        item.transactionsLastRefreshed,
        item.investmentsLastRefreshed,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO items (
            user_id,
            plaid_id,
            active,
            access_token,
            institution_id,
            institution_name,
            healthy,
            cursor,
            last_refreshed,
            transactions_last_refreshed,
            investments_last_refreshed
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbItem>(query, values)).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const fetchActiveItems = async (): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM active_items
        ORDER BY id
    `
    const rows = (await runQuery<DbItem>(query)).rows
    return rows.map(mapDbItem)
}

export const fetchActiveItemWithPlaidId = async (
    plaidId: string
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE plaid_id = $1
        ORDER BY id
    `
    const rows = (await runQuery<DbItem>(query, [plaidId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const fetchActiveItemsWithUserId = async (
    userId: number
): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
        ORDER BY id
    `
    const rows = (await runQuery<DbItem>(query, [userId])).rows
    return rows.map(mapDbItem)
}

export const fetchActiveItemWithUserIdAndInstitutionId = async (
    userId: number,
    institutionId: string
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
            AND institution_id = $2
    `
    const rows = (await runQuery<DbItem>(query, [userId, institutionId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const modifyItemActiveWithId = async (id: number, active: boolean) => {
    const query = `
        UPDATE items
        SET active = $1
        WHERE id = $2
    `
    await runQuery(query, [active, id])
}

export const modifyItemHealthyWithId = async (id: number, healthy: boolean) => {
    const query = `
        UPDATE items
        SET healthy = $1
        WHERE id = $2
    `
    await runQuery(query, [healthy, id])
}

export const modifyItemLastRefreshedWithPlaidId = async (
    plaidId: string,
    lastRefreshed: Date
) => {
    const query = `
        UPDATE items
        SET last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [lastRefreshed, plaidId])
}

export const modifyItemTransactionsLastRefreshedWithPlaidId = async (
    plaidId: string,
    transactionsLastRefreshed: Date
) => {
    const query = `
        UPDATE items
        SET transactions_last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [transactionsLastRefreshed, plaidId])
}

export const modifyItemInvestmentsLastRefreshedWithPlaidId = async (
    plaidId: string,
    investmentsLastRefreshed: Date
) => {
    const query = `
        UPDATE items
        SET investments_last_refreshed = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [investmentsLastRefreshed, plaidId])
}

export const modifyItemCursorWithPlaidId = async (
    plaidId: string,
    cursor: string | null
) => {
    const query = `
        UPDATE items
        SET cursor = $1
        WHERE plaid_id = $2
    `
    await runQuery(query, [cursor, plaidId])
}

interface DbItem {
    id: number
    user_id: number
    plaid_id: string
    active: boolean
    access_token: string
    institution_id: string
    institution_name: string
    healthy: boolean
    cursor: string | null
    last_refreshed: Date | null
    transactions_last_refreshed: Date | null
    investments_last_refreshed: Date | null
}

const mapDbItem = (dbItem: DbItem): Item => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    plaidId: dbItem.plaid_id,
    active: dbItem.active,
    accessToken: dbItem.access_token,
    institutionId: dbItem.institution_id,
    institutionName: dbItem.institution_name,
    healthy: dbItem.healthy,
    cursor: dbItem.cursor,
    lastRefreshed: dbItem.last_refreshed,
    transactionsLastRefreshed: dbItem.transactions_last_refreshed,
    investmentsLastRefreshed: dbItem.investments_last_refreshed,
})
