import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { HoldingWithSecurity } from '../models/holding'

@Injectable({
    providedIn: 'root',
})
export class InvestmentService {
    readonly baseUrl = `${env.apiUrl}/investments`

    constructor(private http: HttpClient) {}

    getHoldings() {
        const url = `${this.baseUrl}/holdings`
        return this.http.get<HoldingWithSecurity[]>(url)
    }
}
