import { DatabaseError } from '../models/error.js'
import { Notification } from '../models/notification.js'
import { logger } from '../utils/logger.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertNotification = async (n: Notification): Promise<void> => {
    const values: unknown[] = [
        n.userId,
        n.typeId,
        n.itemId,
        n.message,
        n.persistent,
        n.read,
        n.active,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO notifications (
            user_id,
            type_id,
            item_id,
            message,
            persistent,
            read,
            active
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
    `

    const result = await runQuery(query, values)
    if (!result.rowCount)
        throw new DatabaseError('failed to insert notification')
}

export const fetchActiveNotificationsWithUserId = async (
    userId: number
): Promise<Notification[]> => {
    const query = `
        SELECT *
        FROM active_notifications
        WHERE user_id = $1
    `
    const rows = (await runQuery<DbNotification>(query, [userId])).rows
    return rows.map(mapDbNotification)
}

export const modifyNotificationsToReadWithUserId = async (
    userId: number
): Promise<void> => {
    const values = [userId]
    const query = `
        UPDATE notifications
        SET read = true
        WHERE user_id = $1
    `
    const result = await runQuery(query, values)
    if (!result.rowCount) logger.warn('no notifications modified')
}

export const modifyNotificationsToInactiveWithItemId = async (
    itemId: number
): Promise<void> => {
    const query = `
        UPDATE notifications
        SET active = false
        WHERE item_id = $1
    `
    const result = await runQuery(query, [itemId])
    if (!result.rowCount) logger.warn('no notifications modified')
}

export const modifyNotificationToInactiveWithUserIdAndId = async (
    userId: number,
    id: number
): Promise<void> => {
    const values = [userId, id]
    const query = `
        UPDATE notifications
        SET active = false
        WHERE user_id = $1
            AND id = $2
    `
    const result = await runQuery(query, values)
    if (!result.rowCount)
        throw new DatabaseError('failed to modify notification to inactive')
}

export const modifyNotificationsToInactiveWithUserIdItemIdAndTypeId = async (
    userId: number,
    itemId: number,
    typeId: number
): Promise<void> => {
    const values = [userId, itemId, typeId]
    const query = `
        UPDATE notifications
        SET active = false
        WHERE user_id = $1
            AND item_id = $2
            AND type_id = $3
    `
    const result = await runQuery(query, values)
    if (!result.rowCount)
        throw new DatabaseError('failed to modify notifications to inactive')
}

interface DbNotification {
    id: number
    user_id: number
    type_id: number
    item_id: number | null
    message: string
    persistent: boolean
    read: boolean
    active: boolean
}

const mapDbNotification = (n: DbNotification): Notification => ({
    id: n.id,
    userId: n.user_id,
    typeId: n.type_id,
    itemId: n.item_id,
    message: n.message,
    persistent: n.persistent,
    read: n.read,
    active: n.active,
})
