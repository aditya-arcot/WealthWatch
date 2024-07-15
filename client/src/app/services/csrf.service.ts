import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CSRFService {
    readonly baseUrl = `${env.apiUrl}/csrf-token`
    readonly csrfTokenName = `csrfToken-${env.name}`

    constructor(private http: HttpClient) {}

    storeCsrfToken(token: string) {
        sessionStorage.setItem(this.csrfTokenName, token)
    }

    getStoredCsrfToken() {
        return sessionStorage.getItem(this.csrfTokenName)
    }

    getCsrfToken() {
        const url = `${this.baseUrl}`
        return this.http.get<{ csrfToken: string }>(url)
    }
}
