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

    constructor(
        private http: HttpClient,
        private secretsSvc: SecretsService
    ) {}

    storeCurrentUser(user: User) {
        sessionStorage.setItem('user', JSON.stringify(user))
    }

    getStoredCurrentUser(): User | null {
        const userStr = sessionStorage.getItem('user')
        if (userStr === null) return null
        return JSON.parse(userStr) as User
    }

    clearStoredCurrentUser(): void {
        sessionStorage.removeItem('user')
    }

    inDemo = () =>
        this.getStoredCurrentUser()?.username ===
        this.secretsSvc.secrets?.demoUser

    getCurrentUser() {
        const url = `${this.baseUrl}/current`
        return this.http.get<User | undefined>(url).pipe(
            switchMap((user?: User) => {
                this.clearStoredCurrentUser()
                if (!user) return throwError(() => new Error('no current user'))
                this.storeCurrentUser(user)
                return of(user)
            })
        )
    }
}
