import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import {
    Item,
    ItemWithAccounts,
    ItemWithAccountsWithHoldings,
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

    refreshItem(plaidItemId: string) {
        const url = `${this.baseUrl}/${plaidItemId}/refresh`
        return this.http.post(url, {})
    }

    deactivateItem(plaidItemId: string) {
        const url = `${this.baseUrl}/${plaidItemId}`
        return this.http.delete(url)
    }
}
