import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { Notification, NotificationTypeEnum } from '../../models/notification'
import { NotificationService } from '../../services/notification.service'

@Component({
    selector: 'app-notifications',
    standalone: true,
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
    constructor(
        private router: Router,
        private notificationSvc: NotificationService
    ) {}

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
        this.router.navigate(['/accounts'], {
            queryParams: {
                itemId: n.itemId,
                withAccounts:
                    n.typeId === NotificationTypeEnum.LinkUpdateWithAccounts,
            },
        })
    }
}
