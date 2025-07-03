import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { AccessRequest, AccessRequestStatusEnum } from '@wealthwatch-shared'
import { env } from '../../environments/env'

@Injectable({
    providedIn: 'root',
})
export class AdminService {
    private http = inject(HttpClient)

    readonly baseUrl = `${env.serverUrl}/admin`

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
