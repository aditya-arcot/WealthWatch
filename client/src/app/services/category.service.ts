import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Category } from 'wealthwatch-shared'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    readonly baseUrl = `${env.serverUrl}/categories`

    constructor(private http: HttpClient) {}

    getCategories() {
        return this.http.get<Category[]>(this.baseUrl)
    }
}
