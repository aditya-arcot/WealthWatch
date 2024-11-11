import { Notification, NotificationTypeEnum } from '../models/notification.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertNotification = async (n: Notification): Promise<void> => {
    if (n.typeId !== NotificationTypeEnum.Info && n.itemId !== null) {
        const existingNotification =
            await fetchActiveNotificationWithTypeIdUserIdAndItemId(
                n.typeId,
                n.userId,
                n.itemId
            )
        if (existingNotification) {
            await modifyNotificationsToInactiveWithTypeIdUserIdAndItemId(
                n.typeId,
                n.userId,
                n.itemId
            )
        }
    }

    const values: unknown[] = [
        n.typeId,
        n.userId,
        n.itemId,
        n.message,
        n.persistent,
        false,
        true,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO notifications (
            type_id,
            user_id,
            item_id,
            message,
            persistent,
            read,
            active
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
    `

    await runQuery(query, values)
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

export const fetchActiveNotificationWithTypeIdUserIdAndItemId = async (
    typeId: number,
    userId: number,
    itemId: number
): Promise<Notification | undefined> => {
    const values: unknown[] = [typeId, userId, itemId]
    const query = `
        SELECT *
        FROM active_notifications
        WHERE type_id = $1
            AND user_id = $2
            AND item_id = $3
        LIMIT 1
    `
    const rows = (await runQuery<DbNotification>(query, values)).rows
    if (!rows[0]) return
    return mapDbNotification(rows[0])
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
    await runQuery(query, values)
}

export const modifyNotificationsToInactiveWithItemId = async (
    itemId: number
): Promise<void> => {
    const query = `
        UPDATE notifications
        SET active = false
        WHERE item_id = $1
    `
    await runQuery(query, [itemId])
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
    await runQuery(query, values)
}

export const modifyNotificationsToInactiveWithTypeIdUserIdAndItemId = async (
    typeId: number,
    userId: number,
    itemId: number
): Promise<void> => {
    const values = [typeId, userId, itemId]
    const query = `
        UPDATE notifications
        SET active = false
        WHERE type_id = $1
            AND user_id = $2
            AND item_id = $3
    `
    await runQuery(query, values)
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
