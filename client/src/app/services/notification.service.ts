import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { of } from 'rxjs'
import { env } from '../../environments/env'
import { Notification } from '../models/notification'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    readonly baseUrl = `${env.apiUrl}/notifications`

    constructor(private http: HttpClient) {}

    getNotifications() {
        return this.http.get<Notification[]>(this.baseUrl)
    }

    updateNotificationsToRead(notifications: Notification[]) {
        const notificationIds = notifications
            .filter((notification) => !notification.read)
            .map((notification) => notification.id)
        if (notificationIds.length === 0) return of(undefined)
        return this.http.patch<void>(`${this.baseUrl}/read`, {
            notificationIds,
        })
    }

    updateNotificationsToInactive(notifications: Notification[]) {
        const notificationIds = notifications
            .filter((notification) => notification.active)
            .map((notification) => notification.id)
        if (notificationIds.length === 0) return of(undefined)
        return this.http.patch<void>(`${this.baseUrl}/inactive`, {
            notificationIds,
        })
    }
}
