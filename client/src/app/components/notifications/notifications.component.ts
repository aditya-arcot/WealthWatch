import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, of, switchMap } from 'rxjs'
import { RouteEnum } from 'src/app/enums/route'
import { Notification, NotificationTypeEnum } from 'wealthwatch-shared'
import { NotificationService } from '../../services/notification.service'
import { LoggerComponent } from '../logger.component'

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css',
})
export class NotificationsComponent extends LoggerComponent {
    private router = inject(Router)
    private notificationSvc = inject(NotificationService)

    constructor() {
        super('NotificationsComponent')
    }

    get notifications(): Notification[] {
        return this.notificationSvc.notifications
    }

    linkUpdateNotification = (n: Notification): boolean => {
        return (
            n.typeId === NotificationTypeEnum.LinkUpdate ||
            n.typeId === NotificationTypeEnum.LinkUpdateWithAccounts
        )
    }

    launchLinkUpdate = (n: Notification): void => {
        void this.router.navigate([RouteEnum.Accounts], {
            queryParams: {
                itemId: n.itemId,
                withAccounts:
                    n.typeId === NotificationTypeEnum.LinkUpdateWithAccounts,
            },
        })
    }

    removeNotification = (notification: Notification): void => {
        this.logger.info('removing notification', { notification })
        this.notificationSvc
            .updateNotificationToInactive(notification.id)
            .pipe(
                switchMap(() => this.notificationSvc.loadNotifications()),
                // silence errors
                catchError(() => of(undefined))
            )
            .subscribe()
    }
}
