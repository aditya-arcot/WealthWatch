import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CSRFService {
    readonly baseUrl = `${env.apiUrl}/csrf-token`

    constructor(private http: HttpClient) {}

    storeCsrfToken(token: string) {
        sessionStorage.setItem('csrfToken', token)
    }

    getStoredCsrfToken() {
        return sessionStorage.getItem('csrfToken')
    }

    getCsrfToken() {
        const url = `${this.baseUrl}`
        return this.http.get<{ csrfToken: string }>(url)
    }
}
