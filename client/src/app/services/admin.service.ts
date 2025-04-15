import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AccessRequestStatusEnum } from 'wealthwatch-shared/enums/accessRequest'
import { AccessRequest } from 'wealthwatch-shared/models/accessRequest'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    readonly baseUrl = `${env.apiUrl}/admin`

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
