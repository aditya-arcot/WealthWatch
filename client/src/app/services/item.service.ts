import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import {
    Item,
    ItemWithAccounts,
    ItemWithAccountsWithHoldings,
    ItemWithCreditCardAccounts,
    ItemWithMortgageAccounts,
    ItemWithStudentLoanAccounts,
} from '../models/item'

@Injectable({
    providedIn: 'root',
})
export class ItemService {
    readonly baseUrl = `${env.apiUrl}/items`

    constructor(private http: HttpClient) {}

    getItems() {
        return this.http.get<Item[]>(this.baseUrl)
    }

    getItemsWithAccounts() {
        const url = `${this.baseUrl}/with-accounts`
        return this.http.get<ItemWithAccounts[]>(url)
    }

    getItemsWithAccountsWithHoldings() {
        const url = `${this.baseUrl}/with-accounts/with-holdings`
        return this.http.get<ItemWithAccountsWithHoldings[]>(url)
    }

    getItemsWithCreditCardAccounts() {
        const url = `${this.baseUrl}/with-credit-card-accounts`
        return this.http.get<ItemWithCreditCardAccounts[]>(url)
    }

    getItemsWithMortgageAccounts() {
        const url = `${this.baseUrl}/with-mortgage-accounts`
        return this.http.get<ItemWithMortgageAccounts[]>(url)
    }

    getItemsWithStudentLoanAccounts() {
        const url = `${this.baseUrl}/with-student-loan-accounts`
        return this.http.get<ItemWithStudentLoanAccounts[]>(url)
    }

    refreshItem(plaidItemId: string) {
        const url = `${this.baseUrl}/${plaidItemId}/refresh`
        return this.http.post(url, {})
    }

    deactivateItem(plaidItemId: string) {
        const url = `${this.baseUrl}/${plaidItemId}`
        return this.http.delete(url)
    }
}
