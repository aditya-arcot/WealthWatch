import { Component } from '@angular/core'
import { Notification } from '../../models/notification'

@Component({
    selector: 'app-notifications',
    standalone: true,
    templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
    notifications: Notification[] = []
}
