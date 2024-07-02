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

    register(
        firstName: string,
        lastName: string,
        email: string,
        username: string,
        password: string
    ) {
        const url = `${this.baseUrl}/register`
        return this.http.post<User>(url, {
            firstName,
            lastName,
            email,
            username,
            password,
        })
    }
}
