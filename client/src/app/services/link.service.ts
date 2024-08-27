import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { PlaidLinkEvent } from '../models/plaidLinkEvent'

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
        return this.http.post<void>(url, { event })
    }

    exchangePublicToken(publicToken: string, metadata: object) {
        const url = `${this.baseUrl}/public-token`
        return this.http.post<void>(url, { publicToken, metadata })
    }
}
