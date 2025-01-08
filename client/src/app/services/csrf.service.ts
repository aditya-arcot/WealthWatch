import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { tap } from 'rxjs'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CSRFService {
    readonly baseUrl = `${env.apiUrl}/csrf-token`
    csrfToken: string | null = null

    constructor(private http: HttpClient) {}

    getCsrfToken() {
        return this.http.get<{ csrfToken: string }>(this.baseUrl).pipe(
            tap((resp) => {
                this.csrfToken = resp.csrfToken
            })
        )
    }
}
