import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { env } from '@environments'
import { Notification } from '@wealthwatch-shared'
import { tap } from 'rxjs'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private http = inject(HttpClient)

    notifications: Notification[] = []
    readonly baseUrl = `${env.serverUrl}/notifications`

    loadNotifications() {
        return this.http.get<Notification[]>(this.baseUrl).pipe(
            tap((notifications) => {
                this.notifications = notifications
            })
        )
    }

    updateAllNotificationsToRead() {
        const url = `${this.baseUrl}/read`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.patch<void>(url, {})
    }

    updateNotificationToInactive(notificationId: number) {
        const url = `${this.baseUrl}/${String(notificationId)}/inactive`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.patch<void>(url, {})
    }
}
