import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { Notification } from '../models/notification'

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    readonly baseUrl = `${env.apiUrl}/notifications`

    constructor(private http: HttpClient) {}

    getNotifications() {
        return this.http.get<Notification[]>(this.baseUrl)
    }

    updateNotificationsToRead() {
        return this.http.patch<void>(`${this.baseUrl}/read`, {})
    }
}
