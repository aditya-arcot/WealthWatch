import { DatabaseError } from '../models/error.js'
import { Item } from '../models/item.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertItem = async (item: Item): Promise<Item> => {
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
    if (!rows[0]) throw new DatabaseError('failed to insert item')
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
        LIMIT 1
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

export const fetchActiveItemWithUserIdAndId = async (
    userId: number,
    itemId: number
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
            AND id = $2
        LIMIT 1
    `
    const rows = (await runQuery<DbItem>(query, [userId, itemId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
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
        LIMIT 1
    `
    const rows = (await runQuery<DbItem>(query, [userId, institutionId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const modifyItemActiveWithId = async (
    id: number,
    active: boolean
): Promise<void> => {
    const query = `
        UPDATE items
        SET active = $1
        WHERE id = $2
    `
    const result = await runQuery(query, [active, id])
    if (!result.rowCount)
        throw new DatabaseError('failed to modify item active')
}

export const modifyItemHealthyWithId = async (
    id: number,
    healthy: boolean
): Promise<void> => {
    const query = `
        UPDATE items
        SET healthy = $1
        WHERE id = $2
    `
    const result = await runQuery(query, [healthy, id])
    if (!result.rowCount)
        throw new DatabaseError('failed to modify item healthy')
}

export const modifyItemLastRefreshedWithPlaidId = async (
    plaidId: string,
    lastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET last_refreshed = $1
        WHERE plaid_id = $2
    `
    const result = await runQuery(query, [lastRefreshed, plaidId])
    if (!result.rowCount)
        throw new DatabaseError('failed to modify item last refreshed')
}

export const modifyItemTransactionsLastRefreshedWithPlaidId = async (
    plaidId: string,
    transactionsLastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET transactions_last_refreshed = $1
        WHERE plaid_id = $2
    `
    const result = await runQuery(query, [transactionsLastRefreshed, plaidId])
    if (!result.rowCount)
        throw new DatabaseError(
            'failed to modify item transactions last refreshed'
        )
}

export const modifyItemInvestmentsLastRefreshedWithPlaidId = async (
    plaidId: string,
    investmentsLastRefreshed: Date
): Promise<void> => {
    const query = `
        UPDATE items
        SET investments_last_refreshed = $1
        WHERE plaid_id = $2
    `
    const result = await runQuery(query, [investmentsLastRefreshed, plaidId])
    if (!result.rowCount)
        throw new DatabaseError(
            'failed to modify item investments last refreshed'
        )
}

export const modifyItemCursorWithPlaidId = async (
    plaidId: string,
    cursor: string | null
): Promise<void> => {
    const query = `
        UPDATE items
        SET cursor = $1
        WHERE plaid_id = $2
    `
    const result = await runQuery(query, [cursor, plaidId])
    if (!result.rowCount)
        throw new DatabaseError('failed to modify item cursor')
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
