import { describe, expect, it } from 'vitest'
import {
    Item,
    Notification,
    NotificationTypeEnum,
} from '../wealthwatch-shared.js'
import { createNotification } from './notification.js'

describe('createNotification', () => {
    const item: Item = {
        id: 123,
        userId: 456,
        plaidId: '',
        active: true,
        accessToken: '',
        institutionId: '',
        institutionName: '',
        healthy: true,
        cursor: '',
        lastRefreshed: null,
        transactionsLastRefreshed: null,
        investmentsLastRefreshed: null,
    }
    const msg = 'test message'

    const expectCreateNotification = (
        type: NotificationTypeEnum,
        notification: Notification
    ) => {
        expect(createNotification(type, item, msg)).toStrictEqual(notification)
    }

    it('creates info notification', () => {
        const type = NotificationTypeEnum.Info
        const notification: Notification = {
            id: -1,
            typeId: type,
            userId: item.userId,
            itemId: item.id,
            message: msg,
            persistent: false,
            read: false,
            active: true,
        }
        expectCreateNotification(type, notification)
    })

    it('creates link update notification', () => {
        const type = NotificationTypeEnum.LinkUpdate
        const notification: Notification = {
            id: -1,
            typeId: type,
            userId: item.userId,
            itemId: item.id,
            message: msg,
            persistent: true,
            read: false,
            active: true,
        }
        expectCreateNotification(type, notification)
    })

    it('creates link update with accounts notification', () => {
        const type = NotificationTypeEnum.LinkUpdateWithAccounts
        const notification: Notification = {
            id: -1,
            typeId: type,
            userId: item.userId,
            itemId: item.id,
            message: msg,
            persistent: true,
            read: false,
            active: true,
        }
        expectCreateNotification(type, notification)
    })
})
