import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { Secrets } from '../models/secrets'

@Injectable({
    providedIn: 'root',
})
export class SecretsService {
    readonly url = `${env.apiUrl}/secrets`
    secrets: Secrets | undefined

    constructor(private http: HttpClient) {}

    getSecrets() {
        return this.http.get<Secrets>(this.url)
    }
}
