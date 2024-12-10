import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { of, switchMap } from 'rxjs'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CSRFService {
    readonly baseUrl = `${env.apiUrl}/csrf-token`
    readonly csrfTokenName = `csrfToken-${env.name}`
    csrfToken: string | null = null

    constructor(private http: HttpClient) {}

    getCsrfToken() {
        return this.http.get<{ csrfToken: string }>(this.baseUrl).pipe(
            switchMap((resp) => {
                this.csrfToken = resp.csrfToken
                return of(resp)
            })
        )
    }
}
