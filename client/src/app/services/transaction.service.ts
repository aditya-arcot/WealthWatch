import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { Transaction } from '../models/transaction'

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    readonly baseUrl = `${env.apiUrl}/transactions`

    constructor(private http: HttpClient) {}

    getTransactions() {
        return this.http.get<Transaction[]>(this.baseUrl)
    }

    updateTransactionCustomName(t: Transaction) {
        const url = `${this.baseUrl}/${t.transactionId}/name`
        return this.http.patch(url, { name: t.customName })
    }

    updateTransactionCustomCategoryId(t: Transaction) {
        const url = `${this.baseUrl}/${t.transactionId}/category`
        return this.http.patch(url, { categoryId: t.customCategoryId })
    }
}
