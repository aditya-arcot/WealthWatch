import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { tap } from 'rxjs'
import { User } from 'wealthwatch-shared'
import { env } from '../../environments/env'
import { SecretsService } from './secrets.service'

@Injectable({
    providedIn: 'root',
})
export class UserService {
    readonly baseUrl = `${env.serverUrl}/users`
    user?: User
    loggedOut = false

    constructor(
        private http: HttpClient,
        private secretsSvc: SecretsService
    ) {}

    inDemo = () => this.user?.username === this.secretsSvc.secrets?.demoUser

    getCurrentUser() {
        const url = `${this.baseUrl}/current`
        return this.http.get<User | undefined>(url).pipe(
            tap((user) => {
                this.user = user
            })
        )
    }
}
