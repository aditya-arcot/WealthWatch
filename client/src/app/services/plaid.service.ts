import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class PlaidService {
    readonly baseUrl = `${env.apiUrl}/plaid`

    constructor(private http: HttpClient) {}

    getLinkToken() {
        const url = `${this.baseUrl}/link-token`
        return this.http.get<{ linkToken: string }>(url)
    }

    exchangePublicToken(publicToken: string, metadata: object) {
        const url = `${this.baseUrl}/public-token`
        return this.http.post<void>(url, { publicToken, metadata })
    }
}
