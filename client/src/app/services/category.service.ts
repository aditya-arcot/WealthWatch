import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Category } from '@wealthwatch-shared'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private http = inject(HttpClient)

    readonly baseUrl = `${env.serverUrl}/categories`

    getCategories() {
        return this.http.get<Category[]>(this.baseUrl)
    }
}
