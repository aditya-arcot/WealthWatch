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
        return this.http.post(`${this.baseUrl}/refresh`, {})
    }
}
