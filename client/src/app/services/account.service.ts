import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { Account } from '../models/account'

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    readonly baseUrl = `${env.apiUrl}/accounts`

    constructor(private http: HttpClient) {}

    getAccounts() {
        return this.http.get<Account[]>(this.baseUrl)
    }
}
