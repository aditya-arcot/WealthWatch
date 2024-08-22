import { Notification } from '../models/notification.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertNotification = async (
    n: Notification
): Promise<Notification | undefined> => {
    const values: unknown[] = [n.userId, n.message, n.read, n.active]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO notifications (
            user_id,
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

export const updateActiveNotificationsToReadByUserId = async (
    userId: number
): Promise<Notification[]> => {
    const query = `
        UPDATE notifications
        SET read = true
        WHERE user_id = $1
            AND active = true
        RETURNING *
    `
    const rows = (await runQuery<DbNotification>(query, [userId])).rows
    return rows.map(mapDbNotification)
}

interface DbNotification {
    id: number
    user_id: number
    message: string
    read: boolean
    active: boolean
}

const mapDbNotification = (n: DbNotification): Notification => ({
    id: n.id,
    userId: n.user_id,
    message: n.message,
    read: n.read,
    active: n.active,
})
