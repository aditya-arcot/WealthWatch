import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import {
    Transaction,
    TransactionsRequest,
    TransactionsResponse,
} from '../models/transaction'

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    readonly baseUrl = `${env.apiUrl}/transactions`

    constructor(private http: HttpClient) {}

    getTransactions(req: TransactionsRequest) {
        let params = new HttpParams()
        if (req.searchQuery) {
            params = params.set('searchQuery', req.searchQuery)
        }
        if (req.startDate) {
            params = params.set('startDate', req.startDate)
        }
        if (req.endDate) {
            params = params.set('endDate', req.endDate)
        }
        if (req.limit) {
            params = params.set('limit', req.limit)
        }
        if (req.offset) {
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
