import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { AccessToken, LinkToken } from '../models/plaid'

@Injectable({
    providedIn: 'root',
})
export class PlaidService {
    readonly baseUrl = `${env.apiUrl}/plaid`

    constructor(private http: HttpClient) {}

    createLinkToken() {
        const url = `${this.baseUrl}/create-link-token`
        return this.http.post<LinkToken>(url, {})
    }

    exchangePublicToken(publicToken: string, metadata: object) {
        const url = `${this.baseUrl}/get-access-token`
        return this.http.post<AccessToken>(url, { publicToken, metadata })
    }
}
