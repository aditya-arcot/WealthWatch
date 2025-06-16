import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { tap } from 'rxjs'
import { Secrets } from 'wealthwatch-shared'
import { env } from '../../environments/env'
import { LogtailService } from './logger.service'

@Injectable({
    providedIn: 'root',
})
export class SecretsService {
    private http = inject(HttpClient)
    private logtailSvc = inject(LogtailService)

    readonly baseUrl = `${env.serverUrl}/secrets`
    secrets: Secrets | undefined

    getSecrets() {
        return this.http.get<Secrets>(this.baseUrl).pipe(
            tap((secrets) => {
                this.secrets = secrets
                this.logtailSvc.configure(secrets.logtailToken)
            })
        )
    }
}
