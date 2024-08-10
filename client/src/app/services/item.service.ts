import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { Item } from '../models/item'

@Injectable({
    providedIn: 'root',
})
export class ItemService {
    readonly baseUrl = `${env.apiUrl}/items`

    constructor(private http: HttpClient) {}

    getItems() {
        return this.http.get<Item[]>(this.baseUrl)
    }

    refreshItemTransactions(itemId: string) {
        return this.http.post(
            `${this.baseUrl}/${itemId}/refresh-transactions`,
            {}
        )
    }

    deactivateItem(itemId: string) {
        return this.http.delete(`${this.baseUrl}/${itemId}`)
    }
}
