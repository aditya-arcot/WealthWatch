import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class InvestmentService {
    private http = inject(HttpClient)

    readonly baseUrl = `${env.serverUrl}/investments`

    refreshInvestments() {
        const url = `${this.baseUrl}/refresh`
        return this.http.post(url, {})
    }
}
