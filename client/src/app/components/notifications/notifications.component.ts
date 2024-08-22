import { Component } from '@angular/core'
import { Router } from '@angular/router'
import {
    LinkUpdateTypeEnum,
    Notification,
    NotificationTypeEnum,
} from '../../models/notification'

@Component({
    selector: 'app-notifications',
    standalone: true,
    templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
    notifications: Notification[] = []

    constructor(private router: Router) {}

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
