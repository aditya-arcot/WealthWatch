import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    readonly baseUrl = `${env.apiUrl}/auth`
    readonly authPaths = ['login', 'logout', 'register']

    constructor(private http: HttpClient) {}

    checkAuthPath(path: string) {
        return this.authPaths.includes(path)
    }

    login(username: string, password: string) {
        const url = `${this.baseUrl}/login`
        return this.http.post<void>(url, { username, password })
    }
}
