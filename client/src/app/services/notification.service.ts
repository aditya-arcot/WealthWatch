import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { catchError, of, tap, throwError } from 'rxjs'
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
        const notificationIds = this.notifications
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
