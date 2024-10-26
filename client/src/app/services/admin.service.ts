import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { env } from '../../environments/env'
import { AccessRequest, AccessRequestStatusEnum } from '../models/accessRequest'

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    readonly baseUrl = `${env.apiUrl}/admin`

    constructor(private http: HttpClient) {}

    getAccessRequests() {
        const url = `${this.baseUrl}/access-request`
        return this.http.get<AccessRequest[]>(url)
    }

    reviewAccessRequest(requestId: number, statusId: AccessRequestStatusEnum) {
        const url = `${this.baseUrl}/access-request/${requestId}`
        return this.http.patch<void>(url, { statusId })
    }
}
