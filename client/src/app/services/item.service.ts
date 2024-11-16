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
        return this.http.get<ItemWithAccounts[]>(
            `${this.baseUrl}/with-accounts`
        )
    }

    getItemsWithAccountsWithHoldings() {
        return this.http.get<ItemWithAccountsWithHoldings[]>(
            `${this.baseUrl}/with-accounts/with-holdings`
        )
    }

    refreshItem(plaidItemId: string) {
        return this.http.post(`${this.baseUrl}/${plaidItemId}/refresh`, {})
    }

    deactivateItem(plaidItemId: string) {
        return this.http.delete(`${this.baseUrl}/${plaidItemId}`)
    }
}
