import { DatePipe } from '@angular/common'
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
import { catchError, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import {
    inCooldown,
    Item,
    ItemWithAccounts,
    refreshCooldown,
} from '../../models/item'
import { PlaidLinkEvent } from '../../models/plaidLinkEvent'
import { AccountService } from '../../services/account.service'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { LinkService } from '../../services/link.service'
import { LoggerService } from '../../services/logger.service'
import { NotificationService } from '../../services/notification.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-accounts',
    standalone: true,
    imports: [LoadingSpinnerComponent, DatePipe],
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
        private accountSvc: AccountService,
        private itemSvc: ItemService,
        private currencySvc: CurrencyService,
        private route: ActivatedRoute,
        private notificationSvc: NotificationService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const institution = sessionStorage.getItem('deactivatedInstitution')
        if (institution !== null) {
            this.alertSvc.addSuccessAlert(`Deleted ${institution} data`)
            sessionStorage.removeItem('deactivatedInstitution')
        }

        this.route.queryParams.subscribe((params) => {
            const itemId: string | undefined = params['itemId']
            if (itemId === undefined) return
            const itemIdNum = parseInt(itemId)
            if (isNaN(itemIdNum)) throw Error('invalid item id')

            const withAccounts: string | undefined = params['withAccounts']
            if (withAccounts === undefined) throw Error('missing with accounts')

            this.linkAccount(itemIdNum, withAccounts === 'true')
        })

        this.loadAccounts()
    }

    loadAccounts(): void {
        this.loading = true
        this.itemSvc
            .getItems()
            .pipe(
                switchMap((items) => {
                    this.logger.debug('loaded items', items)
                    this.itemsWithAccounts = items.map((item) => {
                        return { ...item, accounts: [] }
                    })
                    return this.accountSvc.getAccounts()
                }),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to load accounts', [
                        err.message,
                    ])
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe((accounts) => {
                this.logger.debug('loaded accounts', accounts)
                accounts.forEach((account) => {
                    const item = this.itemsWithAccounts.find(
                        (item) => item.id === account.itemId
                    )
                    if (!item) {
                        this.alertSvc.addErrorAlert(
                            'Something went wrong. Please report this issue.',
                            [
                                `Failed to find item ${account.itemId} for account ${account.id}`,
                            ]
                        )
                        return
                    }
                    item.accounts.push(account)
                })
                this.logger.debug('mapped accounts', this.itemsWithAccounts)
                this.loading = false
            })
    }

    linkAccount(itemId?: number, withAccounts?: boolean): void {
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
                    this.logger.debug('received link token', resp)
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
            this.linkSvc.exchangePublicToken(token, metadata).subscribe({
                next: () => {
                    this.logger.debug('exchanged public token')
                    this.alertSvc.addSuccessAlert(
                        'Success linking institution',
                        ['Loading your accounts']
                    )
                    setTimeout(() => {
                        this.loadAccounts()
                    }, 3000)
                },
                error: (err: HttpErrorResponse) => {
                    this.logger.error('failed to exchange public token', err)
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
                },
            })
        } else {
            this.logger.debug('removing notifications', itemId, withAccounts)
            this.notificationSvc
                .updateNotificationsOfTypeToInactive(itemId, withAccounts)
                .pipe(switchMap(() => this.notificationSvc.loadNotifications()))
                .subscribe()
            this.router.navigateByUrl('/accounts')
        }
    }

    handleLinkExit(
        error: PlaidErrorObject | null,
        metadata: PlaidErrorMetadata
    ): void {
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
                        `Failed to delete ${item.institutionName}`
                    )
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.loading = false
                sessionStorage.setItem(
                    'deactivatedInstitution',
                    item.institutionName
                )
                window.location.reload()
            })
    }

    getDateString(date: Date): string {
        return new Date(date).toLocaleString(undefined, {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
            hour: 'numeric',
            minute: 'numeric',
        })
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
