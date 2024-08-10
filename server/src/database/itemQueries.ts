import { Item } from '../models/item.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertItem = async (item: Item): Promise<Item | undefined> => {
    const values: unknown[] = [
        item.userId,
        item.itemId,
        item.active,
        item.accessToken,
        item.institutionId,
        item.institutionName,
        item.healthy,
        item.cursor,
        item.lastSynced,
        item.lastRefreshed,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO items (
            user_id,
            item_id,
            active,
            access_token,
            institution_id,
            institution_name,
            healthy,
            cursor,
            last_synced,
            last_refreshed
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
    `
    const rows = (await runQuery<DbItem>(query)).rows
    return rows.map(mapDbItem)
}

export const fetchActiveItemById = async (
    itemId: string
): Promise<Item | undefined> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE item_id = $1
    `
    const rows = (await runQuery<DbItem>(query, [itemId])).rows
    if (!rows[0]) return
    return mapDbItem(rows[0])
}

export const fetchActiveItemsByUserId = async (
    userId: number
): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
    `
    const rows = (await runQuery<DbItem>(query, [userId])).rows
    return rows.map(mapDbItem)
}

export const fetchActiveItemByUserIdAndInstitutionId = async (
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

export const modifyItemActiveById = async (id: number, active: boolean) => {
    const query = `
        UPDATE items
        SET active = $1
        WHERE id = $2
    `
    await runQuery(query, [active, id])
}

export const modifyItemLastRefreshedByItemId = async (
    itemId: string,
    lastRefreshed: Date
) => {
    const query = `
        UPDATE items
        SET last_refreshed = $1
        WHERE item_id = $2
    `
    await runQuery(query, [lastRefreshed, itemId])
}

export const modifyItemDataByItemId = async (
    itemId: string,
    cursor: string | null,
    lastSynced: Date
) => {
    const query = `
        UPDATE items
        SET
            cursor = $1,
            last_synced = $2,
            last_refreshed = $2
        WHERE item_id = $3
    `
    await runQuery(query, [cursor, lastSynced, itemId])
}

interface DbItem {
    id: number
    user_id: number
    item_id: string
    active: boolean
    access_token: string
    institution_id: string
    institution_name: string
    healthy: boolean
    cursor: string | null
    last_synced: Date | null
    last_refreshed: Date | null
}

const mapDbItem = (dbItem: DbItem): Item => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    itemId: dbItem.item_id,
    active: dbItem.active,
    accessToken: dbItem.access_token,
    institutionId: dbItem.institution_id,
    institutionName: dbItem.institution_name,
    healthy: dbItem.healthy,
    cursor: dbItem.cursor,
    lastSynced: dbItem.last_synced,
    lastRefreshed: dbItem.last_refreshed,
})
