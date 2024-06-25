import { Component, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { Notification, NotificationType } from '../../models/notification'
import { NotificationService } from '../../services/notification.service'

@Component({
    selector: 'app-notification',
    standalone: true,
    imports: [],
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.css',
})
export class NotificationComponent implements OnDestroy {
    notifications: Notification[] = []
    subscription: Subscription

    constructor(private notificationSvc: NotificationService) {
        this.subscription = this.notificationSvc
            .getNotifications()
            .subscribe((n) => (this.notifications = n))
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe()
    }

    onClose(id: string): void {
        this.notificationSvc.removeNotification(id)
    }

    getNotificationClass(type: NotificationType): string {
        switch (type) {
            case NotificationType.Success:
                return 'alert-success'
            case NotificationType.Error:
                return 'alert-danger'
        }
    }
}
