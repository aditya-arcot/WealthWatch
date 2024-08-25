import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { LinkUpdateTypeEnum } from '../models/notification'
import { PlaidLinkEvent } from '../models/plaidLinkEvent'

@Injectable({
    providedIn: 'root',
})
export class LinkService {
    readonly baseUrl = `${env.apiUrl}/link`

    constructor(private http: HttpClient) {}

    createLinkToken(linkUpdateType?: LinkUpdateTypeEnum, itemId?: number) {
        const url = `${this.baseUrl}/link-token`
        return this.http.post<{ linkToken: string }>(url, {
            itemId,
            updateAccounts: linkUpdateType === LinkUpdateTypeEnum.Accounts,
        })
    }

    handleLinkEvent(event: PlaidLinkEvent) {
        const url = `${this.baseUrl}/link-event`
        return this.http.post<void>(url, { event })
    }

    exchangePublicToken(publicToken: string, metadata: object) {
        const url = `${this.baseUrl}/public-token`
        return this.http.post<void>(url, { publicToken, metadata })
    }
}
