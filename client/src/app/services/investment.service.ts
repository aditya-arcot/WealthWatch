import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class InvestmentService {
    readonly baseUrl = `${env.apiUrl}/investments`

    constructor(private http: HttpClient) {}

    refreshInvestments() {
        const url = `${this.baseUrl}/refresh`
        return this.http.post(url, {})
    }
}
