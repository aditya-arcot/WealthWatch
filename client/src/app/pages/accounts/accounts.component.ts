import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import {
    NgxPlaidLinkService,
    PlaidConfig,
    PlaidErrorMetadata,
    PlaidErrorObject,
    PlaidEventMetadata,
    PlaidLinkHandler,
    PlaidSuccessMetadata,
} from 'ngx-plaid-link'
import { catchError, finalize, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import {
    inCooldown,
    Item,
    ItemWithAccounts,
    refreshCooldown,
} from '../../models/item'
import { PlaidLinkEvent } from '../../models/plaidLinkEvent'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { LinkService } from '../../services/link.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'
import { formatDate } from '../../utilities/date.utility'

@Component({
    selector: 'app-accounts',
    imports: [LoadingSpinnerComponent],
    templateUrl: './accounts.component.html',
})
export class AccountsComponent implements OnInit {
    itemsWithAccounts: ItemWithAccounts[] = []
    loading = false

    constructor(
        private userSvc: UserService,
        private linkSvc: LinkService,
        private logger: LoggerService,
        private plaidLinkSvc: NgxPlaidLinkService,
        private alertSvc: AlertService,
        private itemSvc: ItemService,
        private currencySvc: CurrencyService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            const itemId: string | undefined = params['itemId']
            if (itemId === undefined) return
            const itemIdNum = parseInt(itemId)
            if (isNaN(itemIdNum)) throw Error('invalid item id')

            const withAccounts: string | undefined = params['withAccounts']
            if (withAccounts === undefined) throw Error('missing with accounts')

            this.linkInstitution(itemIdNum, withAccounts === 'true')
        })

        this.loadAccounts()
    }

    loadAccounts(): void {
        this.loading = true
        this.itemSvc
            .getItemsWithAccounts()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to load accounts', [
                        err.message,
                    ])
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((items) => (this.itemsWithAccounts = items))
    }

    linkInstitution(itemId?: number, withAccounts?: boolean): void {
        this.loading = true
        this.linkSvc
            .createLinkToken(itemId, withAccounts)
            .pipe(
                catchError((err) => {
                    this.logger.error('failed to create link token', err)
                    this.alertSvc.addErrorAlert(
                        'Something went wrong. Please try again.'
                    )
                    this.loading = false
                    return throwError(() => err)
                }),
                switchMap((resp) => {
                    this.logger.debug('received link token', resp.linkToken)
                    const config: PlaidConfig = {
                        token: resp.linkToken,
                        onSuccess: (
                            token: string,
                            metadata: PlaidSuccessMetadata
                        ) =>
                            this.handleLinkSuccess(
                                token,
                                metadata,
                                itemId,
                                withAccounts
                            ),
                        onExit: (
                            error: PlaidErrorObject,
                            metadata: PlaidErrorMetadata
                        ) => this.handleLinkExit(error, metadata, itemId),
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
                this.loading = false
            })
    }

    handleLinkSuccess(
        token: string,
        metadata: PlaidSuccessMetadata,
        itemId?: number,
        withAccounts?: boolean
    ): void {
        const type = 'success'
        this.logger.debug(type, token, metadata)
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            timestamp: new Date(),
            type,
            sessionId: metadata.link_session_id,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            publicToken: metadata.public_token,
            status: metadata.transfer_status,
        }
        this.linkSvc.handleLinkEvent(event).subscribe()

        if (itemId === undefined) {
            this.loading = true
            this.linkSvc
                .exchangePublicToken(token, metadata)
                .pipe(
                    catchError((err: HttpErrorResponse) => {
                        this.logger.error(
                            'failed to exchange public token',
                            err
                        )
                        if (err.status === 409) {
                            this.alertSvc.addErrorAlert(
                                'This institution has already been linked'
                            )
                        } else {
                            this.alertSvc.addErrorAlert(
                                'Something went wrong. Please try again'
                            )
                        }
                        this.loading = false
                        return throwError(() => err)
                    })
                )
                .subscribe(() => {
                    this.logger.debug('exchanged public token')
                    this.alertSvc.addSuccessAlert(
                        'Success linking institution',
                        ['Loading account data']
                    )
                    setTimeout(() => {
                        this.loadAccounts()
                    }, 3000)
                })
        } else {
            this.loading = true
            this.linkSvc
                .handleLinkUpdateComplete(itemId, withAccounts)
                .pipe(
                    catchError((err: HttpErrorResponse) => {
                        this.logger.error(
                            'failed to handle link update complete',
                            err
                        )
                        this.alertSvc.addErrorAlert(
                            'Something went wrong. Please try again'
                        )
                        this.loading = false
                        return throwError(() => err)
                    }),
                    finalize(() => this.router.navigateByUrl('/accounts'))
                )
                .subscribe(() => {
                    this.logger.debug('handled link update complete')
                    this.alertSvc.addSuccessAlert(
                        'Success linking institution',
                        ['Loading account data']
                    )
                    setTimeout(() => {
                        this.loadAccounts()
                    }, 3000)
                })
        }
    }

    handleLinkExit(
        error: PlaidErrorObject | null,
        metadata: PlaidErrorMetadata,
        itemId?: number
    ): void {
        if (itemId !== undefined) {
            this.router.navigateByUrl('/accounts')
        }
        const type = 'exit'
        this.logger.debug(type, error, metadata)
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            timestamp: new Date(),
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
        this.linkSvc.handleLinkEvent(event).subscribe()
    }

    handleLinkEvent(eventName: string, metadata: PlaidEventMetadata): void {
        const type = `event - ${eventName.toLowerCase()}`
        this.logger.debug(type, metadata)
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.getStoredCurrentUser()?.id ?? -1,
            timestamp: new Date(),
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
        this.linkSvc.handleLinkEvent(event).subscribe()
    }

    addAccounts(item: Item): void {
        this.router.navigate(['/accounts'], {
            queryParams: {
                itemId: item.id,
                withAccounts: true,
            },
        })
    }

    refreshItem(item: Item): void {
        if (inCooldown(item.lastRefreshed)) {
            const lastRefreshed = item.lastRefreshed
                ? new Date(item.lastRefreshed)
                : null
            const nextRefresh = new Date(
                (lastRefreshed?.getTime() ?? 0) + refreshCooldown
            ).toLocaleTimeString(undefined, { timeStyle: 'short' })
            this.alertSvc.addErrorAlert(
                `${item.institutionName} data was recently refreshed`,
                [`Please wait until ${nextRefresh} before refreshing again`]
            )
            return
        }

        this.loading = true
        this.itemSvc
            .refreshItem(item.plaidId)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    if (err.status === 429) {
                        item.lastRefreshed = new Date()
                    }
                    this.alertSvc.addErrorAlert(
                        `Failed to refresh ${item.institutionName} data`
                    )
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                item.lastRefreshed = new Date()
                this.alertSvc.addSuccessAlert(
                    `Refreshing ${item.institutionName} data`,
                    ['Please check back later']
                )
                this.loading = false
            })
    }

    deactivateItem(item: Item): void {
        if (!confirm('Are you sure you want to unlink this institution?')) {
            this.logger.debug('canceled item deactivation')
            return
        }

        this.loading = true
        this.itemSvc
            .deactivateItem(item.plaidId)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        `Failed to remove ${item.institutionName} accounts`
                    )
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    `Removed ${item.institutionName} accounts`
                )
                this.loadAccounts()
            })
    }

    getLastRefreshedString(item: Item): string {
        return formatDate(item.lastRefreshed)
    }

    getCurrentBalanceString(acc: Account): string {
        return this.currencySvc.format(
            acc.currentBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getAvailableBalanceString(acc: Account): string {
        return this.currencySvc.format(
            acc.availableBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }
}
