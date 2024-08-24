import { Item } from '../models/item.js'
import { Notification, NotificationTypeEnum } from '../models/notification.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertItemNotification = async (
    type: NotificationTypeEnum,
    item: Item,
    message: string
) => {
    const notification: Notification = {
        id: -1,
        typeId: type,
        userId: item.userId,
        itemId: item.id,
        message,
        read: false,
        active: true,
    }
    await insertNotification(notification)
}

export const insertNotification = async (
    n: Notification
): Promise<Notification | undefined> => {
    const values: unknown[] = [
        n.userId,
        n.typeId,
        n.itemId,
        n.message,
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
            read,
            active
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbNotification>(query, values)).rows
    if (!rows[0]) return
    return mapDbNotification(rows[0])
}

export const fetchActiveNotificationsByUserId = async (
    userId: number
): Promise<Notification[]> => {
    const query = `
        SELECT *
        FROM active_notifications
        WHERE user_id = $1
        ORDER BY id DESC
    `
    const rows = (await runQuery<DbNotification>(query, [userId])).rows
    return rows.map(mapDbNotification)
}

export const modifyNotificationsReadByUserIdAndIds = async (
    userId: number,
    ids: number[],
    read: boolean
): Promise<Notification[]> => {
    const placeholder = 3
    const idsPlaceholder = ids
        .map((_, idx) => `$${idx + placeholder}`)
        .join(', ')
    const query = `
        UPDATE notifications
        SET read = $1
        WHERE user_id = $2
            AND id IN (${idsPlaceholder})
        RETURNING *
    `
    const values = [read, userId, ...ids]
    const rows = (await runQuery<DbNotification>(query, values)).rows
    return rows.map(mapDbNotification)
}

export const modifyNotificationsActiveByUserIdAndIds = async (
    userId: number,
    ids: number[],
    active: boolean
): Promise<Notification[]> => {
    const placeholder = 3
    const idsPlaceholder = ids
        .map((_, idx) => `$${idx + placeholder}`)
        .join(', ')
    const query = `
        UPDATE notifications
        SET active = $1
        WHERE user_id = $2
            AND id IN (${idsPlaceholder})
        RETURNING *
    `
    const values = [active, userId, ...ids]
    const rows = (await runQuery<DbNotification>(query, values)).rows
    return rows.map(mapDbNotification)
}

interface DbNotification {
    id: number
    user_id: number
    type_id: number
    item_id: number | null
    message: string
    read: boolean
    active: boolean
}

const mapDbNotification = (n: DbNotification): Notification => ({
    id: n.id,
    userId: n.user_id,
    typeId: n.type_id,
    itemId: n.item_id,
    message: n.message,
    read: n.read,
    active: n.active,
})
