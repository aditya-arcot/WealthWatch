import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { catchError, finalize, of, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import {
    AccessRequest,
    AccessRequestStatusEnum,
} from '../../models/accessRequest'
import { AdminService } from '../../services/admin.service'
import { AlertService } from '../../services/alert.service'
import { LoggerService } from '../../services/logger.service'

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [LoadingSpinnerComponent],
    templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
    accessRequestStatusEnum = AccessRequestStatusEnum
    loading = false
    accessReqs: AccessRequest[] = []

    constructor(
        private adminSvc: AdminService,
        private logger: LoggerService,
        private alertSvc: AlertService
    ) {}

    ngOnInit(): void {
        this.loadRequests()
    }

    loadRequests = () => {
        this.loading = true
        this.adminSvc
            .getAccessRequests()
            .pipe(
                switchMap((reqs) => {
                    this.logger.debug('loaded access requests', reqs)
                    this.accessReqs = reqs
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error('failed to load access requests', err)
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe()
    }

    getPendingRequests = () => {
        return this.accessReqs.filter(
            (req) => req.statusId === AccessRequestStatusEnum.Pending
        )
    }

    getReviewedRequests = () => {
        return this.accessReqs.filter(
            (req) => req.statusId !== AccessRequestStatusEnum.Pending
        )
    }

    getStatusClass = (req: AccessRequest) => {
        switch (req.statusId) {
            case AccessRequestStatusEnum.Rejected:
                return 'text-danger'
            case AccessRequestStatusEnum.Approved:
            case AccessRequestStatusEnum.Completed:
                return 'text-success'
        }
        return ''
    }

    getStatusName = (req: AccessRequest) => {
        switch (req.statusId) {
            case AccessRequestStatusEnum.Pending:
                return 'Pending'
            case AccessRequestStatusEnum.Rejected:
                return 'Rejected'
            case AccessRequestStatusEnum.Approved:
                return 'Approved'
            case AccessRequestStatusEnum.Completed:
                return 'Completed'
        }
        return ''
    }

    getFullName = (req: AccessRequest) => {
        return `${req.firstName} ${req.lastName}`
    }

    reviewRequest = (req: AccessRequest, statusId: AccessRequestStatusEnum) => {
        this.loading = true
        this.adminSvc
            .reviewAccessRequest(req.id, statusId)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Failed to review access request. Try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => this.loadRequests())
    }
}
