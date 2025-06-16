import { Component, OnInit, inject } from '@angular/core'
import { catchError, finalize, throwError } from 'rxjs'
import { AccessRequest, AccessRequestStatusEnum } from 'wealthwatch-shared'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../../components/logger.component'
import { AdminService } from '../../services/admin.service'
import { AlertService } from '../../services/alert.service'
import { formatDate } from '../../utilities/date.utility'

@Component({
    selector: 'app-admin',
    imports: [LoadingSpinnerComponent],
    templateUrl: './admin.component.html',
})
export class AdminComponent extends LoggerComponent implements OnInit {
    private adminSvc = inject(AdminService)
    private alertSvc = inject(AlertService)

    accessRequestStatusEnum = AccessRequestStatusEnum
    loading = false
    accessReqs: AccessRequest[] = []

    constructor() {
        super('AdminComponent')
    }

    ngOnInit(): void {
        this.loadRequests()
    }

    loadRequests = () => {
        this.logger.info('loading access requests')
        this.loading = true
        this.adminSvc
            .getAccessRequests()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to load access requests'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((reqs) => (this.accessReqs = reqs))
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

    getDateString(date: Date): string {
        return formatDate(date, true, true)
    }

    reviewRequest = (req: AccessRequest, statusId: AccessRequestStatusEnum) => {
        this.logger.info('reviewing access request', { req, statusId })
        this.loading = true
        this.adminSvc
            .reviewAccessRequest(req.id, statusId)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to review access request'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => this.loadRequests())
    }
}
