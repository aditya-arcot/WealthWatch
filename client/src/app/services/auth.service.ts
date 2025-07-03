import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { User } from '@wealthwatch-shared'
import { tap } from 'rxjs'
import { env } from '../../environments/env'
import { UserService } from './user.service'

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient)
    private userSvc = inject(UserService)

    readonly baseUrl = `${env.serverUrl}/auth`

    requestAccess(firstName: string, lastName: string, email: string) {
        const url = `${this.baseUrl}/access-request`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.post<void>(url, {
            firstName,
            lastName,
            email,
        })
    }

    validateAccessCode(accessCode: string) {
        const url = `${this.baseUrl}/access-code`
        return this.http.post<{ name: string; email: string }>(url, {
            accessCode,
        })
    }

    register(accessCode: string, username: string, password: string) {
        const url = `${this.baseUrl}/register`
        return this.http
            .post<User>(url, {
                accessCode,
                username,
                password,
            })
            .pipe(
                tap((user) => {
                    this.userSvc.user = user
                })
            )
    }

    login(username: string, password: string) {
        const url = `${this.baseUrl}/login`
        return this.http.post<User>(url, { username, password }).pipe(
            tap((user) => {
                this.userSvc.user = user
            })
        )
    }

    loginWithDemo() {
        const url = `${this.baseUrl}/login/demo`
        return this.http.post<User>(url, {}).pipe(
            tap((user) => {
                this.userSvc.user = user
            })
        )
    }

    logout() {
        const url = `${this.baseUrl}/logout`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.post<void>(url, {}).pipe(
            tap(() => {
                this.userSvc.user = undefined
                this.userSvc.loggedOut = true
            })
        )
    }
}
