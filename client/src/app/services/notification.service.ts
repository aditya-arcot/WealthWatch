import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { tap } from 'rxjs'
import { env } from '../../environments/env'
import { Notification } from '../models/notification'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    notifications: Notification[] = []
    readonly baseUrl = `${env.apiUrl}/notifications`

    constructor(private http: HttpClient) {}

    loadNotifications() {
        return this.http.get<Notification[]>(this.baseUrl).pipe(
            tap((notifications) => {
                this.notifications = notifications
            })
        )
    }

    updateAllNotificationsToRead() {
        const url = `${this.baseUrl}/read`
        return this.http.patch<void>(url, {})
    }

    updateNotificationToInactive(notificationId: number) {
        const url = `${this.baseUrl}/${notificationId}/inactive`
        return this.http.patch<void>(url, {})
    }
}
