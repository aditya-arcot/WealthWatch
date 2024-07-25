import { runQuery } from '../utils/database.js'

export interface Item {
    id: number
    userId: number
    itemId: string
    active: boolean
    accessToken: string
    institutionId: string
    institutionName: string
    healthy: boolean
    cursor: string | null
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
})

export const retrieveItemById = async (
    itemId: string
): Promise<Item | null> => {
    const query = `
        SELECT * 
        FROM active_items
        WHERE item_id = $1
        `
    const rows: DbItem[] = (await runQuery(query, [itemId])).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const retrieveItemByUserIdAndInstitutionId = async (
    userId: number,
    institutionId: string
): Promise<Item | null> => {
    const query = `
        SELECT * 
        FROM active_items
        WHERE user_id = $1
            AND institution_id = $2
        `
    const rows: DbItem[] = (await runQuery(query, [userId, institutionId])).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const retrieveItemsByUserId = async (
    userId: number
): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM active_items
        WHERE user_id = $1
    `
    const rows: DbItem[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbItem)
}

export const createItem = async (
    userId: number,
    itemId: string,
    accessToken: string,
    institutionId: string,
    institutionName: string,
    active: boolean = true,
    healthy: boolean = true,
    cursor?: string
): Promise<Item | null> => {
    const query = `
        INSERT INTO items (
            user_id,
            item_id,
            active,
            access_token,
            institution_id,
            institution_name,
            healthy,
            cursor
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `
    const rows: DbItem[] = (
        await runQuery(query, [
            userId,
            itemId,
            active,
            accessToken,
            institutionId,
            institutionName,
            healthy,
            cursor ?? null,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const updateItemCursor = async (
    itemId: string,
    cursor: string | null
) => {
    const query = `
        UPDATE items 
        SET cursor = $1 
        WHERE item_id = $2
    `
    await runQuery(query, [cursor, itemId])
}

export const updateItemToInactive = async (id: number) => {
    const query = `
        UPDATE items 
        SET active = $1 
        WHERE id = $2
    `
    await runQuery(query, [false, id])
}
