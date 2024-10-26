import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { User } from '../models/user'

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    readonly baseUrl = `${env.apiUrl}/auth`

    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        const url = `${this.baseUrl}/login`
        return this.http.post<User>(url, { username, password })
    }

    logout() {
        const url = `${this.baseUrl}/logout`
        return this.http.post<void>(url, {})
    }

    requestAccess(firstName: string, lastName: string, email: string) {
        const url = `${this.baseUrl}/access-request`
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
        return this.http.post<User>(url, {
            accessCode,
            username,
            password,
        })
    }
}
