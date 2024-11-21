import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import {
    Transaction,
    TransactionsAndCounts,
    TransactionsRequestParams,
} from '../models/transaction'

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    readonly baseUrl = `${env.apiUrl}/transactions`

    constructor(private http: HttpClient) {}

    getTransactions(
        req: TransactionsRequestParams,
        numCategories: number,
        numAccounts: number
    ) {
        let params = new HttpParams()
        if (req.searchQuery !== undefined && req.searchQuery !== '') {
            params = params.set('searchQuery', req.searchQuery)
        }
        if (req.startDate) {
            params = params.set('startDate', req.startDate.toISOString())
        }
        if (req.endDate) {
            params = params.set('endDate', req.endDate.toISOString())
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
            req.categoryIds.size > 0 &&
            req.categoryIds.size !== numCategories
        ) {
            req.categoryIds.forEach(
                (id) => (params = params.append('categoryId', id))
            )
        }
        if (
            req.accountIds !== null &&
            req.accountIds !== undefined &&
            req.accountIds.size > 0 &&
            req.accountIds.size !== numAccounts
        ) {
            req.accountIds.forEach(
                (id) => (params = params.append('accountId', id))
            )
        }
        if (req.limit !== undefined) {
            params = params.set('limit', req.limit)
        }
        if (req.offset !== undefined) {
            params = params.set('offset', req.offset)
        }
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
