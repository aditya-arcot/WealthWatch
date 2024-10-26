import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { User } from '../models/user'

@Injectable({
    providedIn: 'root',
})
export class UserService {
    readonly baseUrl = `${env.apiUrl}/users`

    constructor(private http: HttpClient) {}

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

    getCurrentUser() {
        const url = `${this.baseUrl}/current`
        return this.http.get<User | undefined>(url)
    }
}
