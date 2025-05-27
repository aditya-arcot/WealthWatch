import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Transaction, TransactionsAndCounts } from 'wealthwatch-shared'
import { env } from '../../environments/env'
import { TransactionsRequestParams } from '../models/transaction'

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    readonly baseUrl = `${env.serverUrl}/transactions`

    constructor(private http: HttpClient) {}

    getTransactions(req: TransactionsRequestParams) {
        let params = new HttpParams()
        if (req.searchQuery.length > 0) {
            params = params.set('searchQuery', req.searchQuery)
        }
        if (req.startDate) {
            params = params.set('startDate', req.startDate.toISOString())
        }
        if (req.endDate) {
            params = params.set('endDate', req.endDate.toISOString())
        }
        if (req.minAmount !== null) {
            params = params.set('minAmount', req.minAmount)
        }
        if (req.maxAmount !== null) {
            params = params.set('maxAmount', req.maxAmount)
        }
        if (req.categoryIds !== undefined && req.categoryIds.size > 0) {
            req.categoryIds.forEach(
                (id) => (params = params.append('categoryId', id))
            )
        }
        if (req.accountIds !== undefined && req.accountIds.size > 0) {
            req.accountIds.forEach(
                (id) => (params = params.append('accountId', id))
            )
        }
        params = params.set('limit', req.limit)
        params = params.set('offset', req.offset)
        return this.http.get<TransactionsAndCounts>(this.baseUrl, { params })
    }

    updateTransactionCustomName(t: Transaction) {
        const url = `${this.baseUrl}/${t.plaidId}/name`
        return this.http.patch(url, { customName: t.customName })
    }

    updateTransactionCustomCategoryId(t: Transaction) {
        const url = `${this.baseUrl}/${t.plaidId}/category`
        return this.http.patch(url, { customCategoryId: t.customCategoryId })
    }

    updateTransactionNote(t: Transaction) {
        const url = `${this.baseUrl}/${t.plaidId}/note`
        return this.http.patch(url, { note: t.note })
    }

    refreshTransactions() {
        const url = `${this.baseUrl}/refresh`
        return this.http.post(url, {})
    }
}
