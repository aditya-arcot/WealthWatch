import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import {
    Transaction,
    TransactionsRequestParams,
    TransactionsResponse,
} from '../models/transaction'

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    readonly baseUrl = `${env.apiUrl}/transactions`

    constructor(private http: HttpClient) {}

    getTransactions(req: TransactionsRequestParams) {
        let params = new HttpParams()
        if (req.searchQuery !== null && req.searchQuery !== undefined) {
            params = params.set('searchQuery', req.searchQuery)
        }
        if (req.startDate) {
            params = params.set('startDate', req.startDate)
        }
        if (req.endDate) {
            params = params.set('endDate', req.endDate)
        }
        if (req.minAmount !== null && req.minAmount !== undefined) {
            params = params.set('minAmount', req.minAmount)
        }
        if (req.maxAmount !== null && req.maxAmount !== undefined) {
            params = params.set('maxAmount', req.maxAmount)
        }
        if (
            req.categoryIds !== null &&
            req.categoryIds !== undefined &&
            req.categoryIds.size > 0
        ) {
            req.categoryIds.forEach(
                (id) => (params = params.append('categoryId', id))
            )
        }
        if (req.limit !== undefined) {
            params = params.set('limit', req.limit)
        }
        if (req.offset !== undefined) {
            params = params.set('offset', req.offset)
        }
        return this.http.get<TransactionsResponse>(this.baseUrl, { params })
    }

    updateTransactionCustomName(t: Transaction) {
        const url = `${this.baseUrl}/${t.transactionId}/name`
        return this.http.patch(url, { name: t.customName })
    }

    updateTransactionCustomCategoryId(t: Transaction) {
        const url = `${this.baseUrl}/${t.transactionId}/category`
        return this.http.patch(url, { categoryId: t.customCategoryId })
    }

    refreshTransactions() {
        return this.http.post(`${this.baseUrl}/refresh`, {})
    }
}
