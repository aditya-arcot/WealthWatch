import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AccessRequest, AccessRequestStatusEnum } from 'wealthwatch-shared'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    readonly baseUrl = `${env.serverUrl}/admin`

    constructor(private http: HttpClient) {}

    getAccessRequests() {
        const url = `${this.baseUrl}/access-requests`
        return this.http.get<AccessRequest[]>(url)
    }

    reviewAccessRequest(requestId: number, statusId: AccessRequestStatusEnum) {
        const url = `${this.baseUrl}/access-requests/${requestId}`
        /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
        return this.http.patch<void>(url, { statusId })
    }
}
