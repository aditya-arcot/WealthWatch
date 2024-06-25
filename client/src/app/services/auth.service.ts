import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    readonly baseUrl = `${env.apiUrl}/auth`

    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        const url = `${this.baseUrl}/login`
        return this.http.post<void>(url, { username, password })
    }

    logout() {
        const url = `${this.baseUrl}/logout`
        return this.http.post<void>(url, {})
    }

    register(
        firstName: string,
        lastName: string,
        email: string,
        username: string,
        password: string
    ) {
        const url = `${this.baseUrl}/register`
        return this.http.post<void>(url, {
            firstName,
            lastName,
            email,
            username,
            password,
        })
    }
}
