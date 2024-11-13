import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { CategorySummary, CategoryTotalByDate } from '../models/spending'

@Injectable({
    providedIn: 'root',
})
export class SpendingService {
    readonly baseUrl = `${env.apiUrl}/spending`

    constructor(private http: HttpClient) {}

    getCategorySummaries(startDate: Date | null, endDate: Date | null) {
        let params = new HttpParams()
        if (startDate) {
            params = params.set('startDate', startDate.toISOString())
        }
        if (endDate) {
            params = params.set('endDate', endDate.toISOString())
        }
        const url = `${this.baseUrl}/category-summaries`
        return this.http.get<CategorySummary[]>(url, { params })
    }

    getTotalByCategoryAndDate(startDate: Date | null, endDate: Date | null) {
        let params = new HttpParams()
        if (startDate) {
            params = params.set('startDate', startDate.toISOString())
        }
        if (endDate) {
            params = params.set('endDate', endDate.toISOString())
        }
        const url = `${this.baseUrl}/category-and-date`
        return this.http.get<{ dates: Date[]; totals: CategoryTotalByDate[] }>(
            url,
            { params }
        )
    }
}
