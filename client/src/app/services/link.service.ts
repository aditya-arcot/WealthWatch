import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NotificationTypeEnum, PlaidLinkEvent } from 'wealthwatch-shared'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class LinkService {
    readonly baseUrl = `${env.apiUrl}/link`

    constructor(private http: HttpClient) {}

    createLinkToken(itemId?: number, withAccounts?: boolean) {
        const url = `${this.baseUrl}/link-token`
        return this.http.post<{ linkToken: string }>(url, {
            itemId,
            updateAccounts: withAccounts,
        })
    }

    handleLinkEvent(event: PlaidLinkEvent) {
        const url = `${this.baseUrl}/link-event`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.post<void>(url, { event })
    }

    exchangePublicToken(publicToken: string, metadata: object) {
        const url = `${this.baseUrl}/public-token`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.post<void>(url, { publicToken, metadata })
    }

    handleLinkUpdateComplete(itemId: number, withAccounts?: boolean) {
        const notificationTypeId = withAccounts
            ? NotificationTypeEnum.LinkUpdateWithAccounts
            : NotificationTypeEnum.LinkUpdate
        const url = `${this.baseUrl}/link-update`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.post<void>(url, { itemId, notificationTypeId })
    }
}
