import { HttpErrorResponse } from '@angular/common/http'
import { Component } from '@angular/core'
import {
    NgxPlaidLinkService,
    PlaidConfig,
    PlaidLinkHandler,
} from 'ngx-plaid-link'
import { catchError, switchMap, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { LoggerService } from '../../services/logger.service'
import { PlaidService } from '../../services/plaid.service'

@Component({
    selector: 'app-accounts',
    standalone: true,
    imports: [],
    templateUrl: './accounts.component.html',
})
export class AccountsComponent {
    constructor(
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
                        onLoad: () => this.logger.debug('loaded plaid link'),
                        onExit: () => this.logger.debug('exited plaid link'),
                        onSuccess: (token: string, metadata: object) =>
                            this.handleLinkSuccess(token, metadata),
                    }
                    return this.plaidLinkSvc.createPlaid(config)
                })
            )
            .subscribe((handler: PlaidLinkHandler) => {
                handler.open()
            })
    }

    handleLinkSuccess(token: string, metadata: object): void {
        this.logger.debug('plaid link success', token, metadata)
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
}
