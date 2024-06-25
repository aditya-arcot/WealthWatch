import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable } from 'rxjs'
import { v4 as uuid } from 'uuid'
import { Notification, NotificationType } from '../models/notification'
import { LoggerService } from './logger.service'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private notifications: Notification[] = []
    private notificationSubject = new BehaviorSubject<Notification[]>([])

    constructor(
        private logger: LoggerService,
        private router: Router
    ) {}

    getNotifications(): Observable<Notification[]> {
        return this.notificationSubject.asObservable()
    }

    addSuccessNotification(message: string, subtext?: string[]): void {
        this.addNotification(NotificationType.Success, message, subtext)
        if (subtext) {
            this.logger.info(message, subtext)
        } else {
            this.logger.info(message)
        }
    }

    addErrorNotification(message: string, subtext?: string[]): void {
        this.addNotification(NotificationType.Error, message, subtext)
        if (subtext) {
            this.logger.error(message, subtext)
        } else {
            this.logger.error(message)
        }
    }

    private addNotification(
        type: NotificationType,
        message: string,
        subtext?: string[]
    ): void {
        const notification: Notification = {
            id: uuid(),
            type,
            message,
            subtext,
        }
        this.notifications.push(notification)
        this.notificationSubject.next([...this.notifications])
        if (type === NotificationType.Success) {
            setTimeout(() => {
                this.removeNotification(notification.id)
            }, 10000)
        }
    }

    removeNotification(id: string): void {
        this.notifications = this.notifications.filter((n) => n.id !== id)
        this.notificationSubject.next([...this.notifications])
    }

    clearNotifications(): void {
        this.notifications = []
        this.notificationSubject.next([...this.notifications])
    }
}
