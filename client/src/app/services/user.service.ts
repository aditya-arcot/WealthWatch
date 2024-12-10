import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { of, switchMap, throwError } from 'rxjs'
import { env } from '../../environments/env'
import { User } from '../models/user'
import { SecretsService } from './secrets.service'

@Injectable({
    providedIn: 'root',
})
export class UserService {
    readonly baseUrl = `${env.apiUrl}/users`
    user: User | null = null
    loggedOut = false

    constructor(
        private http: HttpClient,
        private secretsSvc: SecretsService
    ) {}

    inDemo = () => this.user?.username === this.secretsSvc.secrets?.demoUser

    getCurrentUser() {
        const url = `${this.baseUrl}/current`
        return this.http.get<User | undefined>(url).pipe(
            switchMap((user?: User) => {
                this.user = null
                if (!user) return throwError(() => new Error('no current user'))
                this.user = user
                return of(user)
            })
        )
    }
}
