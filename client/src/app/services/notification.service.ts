import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { catchError, tap, throwError } from 'rxjs'
import { env } from '../../environments/env'
import { Notification } from '../models/notification'
import { LoggerService } from './logger.service'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    notifications: Notification[] = []
    readonly baseUrl = `${env.apiUrl}/notifications`

    constructor(
        private http: HttpClient,
        private logger: LoggerService
    ) {}

    loadNotifications() {
        this.logger.debug('loading notifications')
        return this.http.get<Notification[]>(this.baseUrl).pipe(
            tap((notifications) => {
                this.notifications = notifications
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load notifications', err)
                return throwError(() => err)
            })
        )
    }

    updateAllNotificationsToRead() {
        const url = `${this.baseUrl}/read`
        return this.http.patch<void>(url, {})
    }

    updateNotificationToInactive(notificationId: number) {
        const url = `${this.baseUrl}/inactive`
        return this.http.patch<void>(url, {
            notificationId,
        })
    }
}
