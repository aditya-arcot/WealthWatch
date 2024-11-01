import { DatabaseError } from '../models/error.js'
import { Item } from '../models/item.js'
import { Notification, NotificationTypeEnum } from '../models/notification.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertItemNotification = (
    type: NotificationTypeEnum,
    item: Item,
    message: string,
    persistent: boolean = false
) => {
    const notification: Notification = {
        id: -1,
        typeId: type,
        userId: item.userId,
        itemId: item.id,
        message,
        persistent,
        read: false,
        active: true,
    }
    return insertNotification(notification)
}

const insertNotification = async (n: Notification): Promise<void> => {
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
        ORDER BY id DESC
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
    if (!result.rowCount)
        throw new DatabaseError('failed to modify notifications to read')
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

export const modifyNotificationsToInactiveWithUserIdAndTypeId = async (
    userId: number,
    typeId: number
): Promise<void> => {
    const values = [userId, typeId]
    const query = `
        UPDATE notifications
        SET active = false
        WHERE user_id = $1
            AND type_id = $2
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
