import { HttpErrorResponse } from '@angular/common/http'
import { Component } from '@angular/core'
import {
    NgxPlaidLinkService,
    PlaidConfig,
    PlaidErrorMetadata,
    PlaidErrorObject,
    PlaidEventMetadata,
    PlaidLinkHandler,
    PlaidSuccessMetadata,
} from 'ngx-plaid-link'
import { catchError, switchMap, throwError } from 'rxjs'
import { LinkEvent } from '../../models/plaid'
import { AlertService } from '../../services/alert.service'
import { LoggerService } from '../../services/logger.service'
import { PlaidService } from '../../services/plaid.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-accounts',
    standalone: true,
    imports: [],
    templateUrl: './accounts.component.html',
})
export class AccountsComponent {
    constructor(
        private userSvc: UserService,
        private plaidSvc: PlaidService,
        private logger: LoggerService,
        private plaidLinkSvc: NgxPlaidLinkService,
        private alertSvc: AlertService
    ) {}

    linkAccount(): void {
        this.plaidSvc
            .getLinkToken()
            .pipe(
                catchError((err) => {
                    this.logger.error('failed to create link token', err)
                    this.alertSvc.addErrorAlert(
                        'Something went wrong. Please try again.'
                    )
                    return throwError(() => err)
                }),
                switchMap((resp) => {
                    this.logger.debug('received link token', resp)
                    const config: PlaidConfig = {
                        token: resp.linkToken,
                        onSuccess: (
                            token: string,
                            metadata: PlaidSuccessMetadata
                        ) => this.handleLinkSuccess(token, metadata),
                        onExit: (
                            error: PlaidErrorObject,
                            metadata: PlaidErrorMetadata
                        ) => this.handleLinkExit(error, metadata),
                        onEvent: (
                            eventName: string,
                            metadata: PlaidEventMetadata
                        ) => this.handleLinkEvent(eventName, metadata),
                    }
                    return this.plaidLinkSvc.createPlaid(config)
                })
            )
            .subscribe((handler: PlaidLinkHandler) => {
                handler.open()
            })
    }

    handleLinkSuccess(token: string, metadata: PlaidSuccessMetadata): void {
        const type = 'success'
        this.logger.debug(type, token, metadata)
        const event: LinkEvent = {
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            type,
            sessionId: metadata.link_session_id,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            publicToken: metadata.public_token,
            status: metadata.transfer_status,
        }
        this.plaidSvc.handleLinkEvent(event).subscribe()

        this.plaidSvc.exchangePublicToken(token, metadata).subscribe({
            next: () => {
                this.logger.debug('exchanged public token')
                this.alertSvc.addSuccessAlert('Success linking account')
            },
            error: (err: HttpErrorResponse) => {
                this.logger.error('failed to exchange public token', err)
                if (err.status === 409) {
                    this.alertSvc.addErrorAlert(
                        'This account has already been linked'
                    )
                } else {
                    this.alertSvc.addErrorAlert(
                        'Something went wrong. Please try again'
                    )
                }
            },
        })
    }

    handleLinkExit(
        error: PlaidErrorObject | null,
        metadata: PlaidErrorMetadata
    ): void {
        const type = 'exit'
        this.logger.debug(type, error, metadata)
        const event: LinkEvent = {
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            type,
            sessionId: metadata.link_session_id,
            requestId: metadata.request_id,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            status: metadata.status,
            errorType: error?.error_type,
            errorCode: error?.error_code,
            errorMessage: error?.error_message,
        }
        this.plaidSvc.handleLinkEvent(event).subscribe()
    }

    handleLinkEvent(eventName: string, metadata: PlaidEventMetadata): void {
        const type = `event - ${eventName.toLowerCase()}`
        this.logger.debug(type, metadata)
        const event: LinkEvent = {
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            type,
            sessionId: metadata.link_session_id,
            requestId: metadata.request_id,
            institutionId: metadata.institution_id,
            institutionName: metadata.institution_name,
            status: metadata.exit_status,
            errorType: metadata.error_type,
            errorCode: metadata.error_code,
            errorMessage: metadata.error_message,
        }
        this.plaidSvc.handleLinkEvent(event).subscribe()
    }
}
