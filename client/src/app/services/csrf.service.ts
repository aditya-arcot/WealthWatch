import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of, tap } from 'rxjs'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CsrfService {
    readonly baseUrl = `${env.apiUrl}/csrf-token`
    private csrfToken: string | null = null

    constructor(private http: HttpClient) {}

    getToken(): Observable<{ csrfToken: string }> {
        if (this.csrfToken) return of({ csrfToken: this.csrfToken })
        return this.http
            .get<{ csrfToken: string }>(this.baseUrl)
            .pipe(tap((resp) => (this.csrfToken = resp.csrfToken)))
    }

    clearToken = () => (this.csrfToken = null)
}
