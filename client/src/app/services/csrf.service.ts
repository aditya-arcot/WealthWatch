import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, of, tap } from 'rxjs'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class CsrfService {
    private http = inject(HttpClient)

    readonly baseUrl = `${env.serverUrl}/csrf-token`
    private csrfToken: string | null = null

    getToken(): Observable<{ csrfToken: string }> {
        if (this.csrfToken) return of({ csrfToken: this.csrfToken })
        return this.http
            .get<{ csrfToken: string }>(this.baseUrl)
            .pipe(tap((resp) => (this.csrfToken = resp.csrfToken)))
    }

    clearToken = () => (this.csrfToken = null)
}
