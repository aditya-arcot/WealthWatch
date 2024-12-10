import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { tap } from 'rxjs'
import { env } from '../../environments/env'
import { Secrets } from '../models/secrets'
import { LoggerService } from './logger.service'

@Injectable({
    providedIn: 'root',
})
export class SecretsService {
    readonly baseUrl = `${env.apiUrl}/secrets`
    secrets: Secrets | undefined

    constructor(
        private http: HttpClient,
        private logger: LoggerService
    ) {}

    getSecrets() {
        return this.http.get<Secrets>(this.baseUrl).pipe(
            tap((secrets) => {
                this.secrets = secrets
                this.logger.configureLogtail(secrets.logtailToken)
            })
        )
    }
}
