import { Component } from '@angular/core'
import { Router } from '@angular/router'
import {
    LinkUpdateTypeEnum,
    Notification,
    NotificationTypeEnum,
} from '../../models/notification'
import { NotificationService } from '../../services/notification.service'

@Component({
    selector: 'app-notifications',
    standalone: true,
    templateUrl: './notifications.component.html',
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
            n.typeId === NotificationTypeEnum.LinkUpdateRequired ||
            n.typeId === NotificationTypeEnum.LinkUpdateOptional ||
            n.typeId === NotificationTypeEnum.LinkUpdateOptionalNewAccounts
        )
    }

    launchLinkUpdate = (n: Notification): void => {
        let linkUpdateType: LinkUpdateTypeEnum | undefined = undefined
        if (n.typeId === NotificationTypeEnum.LinkUpdateRequired) {
            linkUpdateType = LinkUpdateTypeEnum.Required
        } else if (n.typeId === NotificationTypeEnum.LinkUpdateOptional) {
            linkUpdateType = LinkUpdateTypeEnum.Optional
        } else if (
            n.typeId === NotificationTypeEnum.LinkUpdateOptionalNewAccounts
        ) {
            linkUpdateType = LinkUpdateTypeEnum.Accounts
        }
        this.router.navigate(['/accounts'], {
            queryParams: { linkUpdateType, itemId: n.itemId },
        })
    }
}
