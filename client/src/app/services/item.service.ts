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

    refreshItem(plaidItemId: string) {
        return this.http.post(`${this.baseUrl}/${plaidItemId}/refresh`, {})
    }

    deactivateItem(plaidItemId: string) {
        return this.http.delete(`${this.baseUrl}/${plaidItemId}`)
    }
}
