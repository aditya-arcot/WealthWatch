import { DatePipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
    NgxPlaidLinkService,
    PlaidConfig,
    PlaidErrorMetadata,
    PlaidErrorObject,
    PlaidEventMetadata,
    PlaidLinkHandler,
    PlaidSuccessMetadata,
} from 'ngx-plaid-link'
import { catchError, of, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import { Item, ItemWithAccounts, refreshCooldown } from '../../models/item'
import {
    LinkUpdateTypeEnum,
    NotificationTypeEnum,
} from '../../models/notification'
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
        private notificationSvc: NotificationService
    ) {}

    ngOnInit(): void {
        const institution = sessionStorage.getItem('deactivatedInstitution')
        if (institution !== null) {
            this.alertSvc.addSuccessAlert(`Deleted ${institution} data`)
            sessionStorage.removeItem('deactivatedInstitution')
        }

        this.route.queryParams.subscribe((params) => {
            const linkUpdateType = params['linkUpdateType'] as
                | string
                | undefined
            if (linkUpdateType === undefined) return

            const linkUpdateTypeEnum = linkUpdateType as LinkUpdateTypeEnum
            if (
                !linkUpdateTypeEnum ||
                !Object.values(LinkUpdateTypeEnum).includes(linkUpdateTypeEnum)
            )
                throw Error('invalid notification type')

            const itemId = params['itemId'] as string | undefined
            if (itemId === undefined) throw Error('missing item id')
            const itemIdNum = parseInt(itemId)
            if (isNaN(itemIdNum)) throw Error('invalid item id')

            this.linkAccount(linkUpdateTypeEnum, itemIdNum)
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
                                `Failed to find item with id ${account.itemId} for account ${account.id}`,
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

    linkAccount(linkUpdateType?: LinkUpdateTypeEnum, itemId?: number): void {
        this.loading = true
        this.linkSvc
            .createLinkToken(linkUpdateType, itemId)
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
                                linkUpdateType,
                                itemId
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
        linkUpdateType?: LinkUpdateTypeEnum,
        itemId?: number
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

        if (linkUpdateType === undefined) {
            this.loading = true
            this.linkSvc.exchangePublicToken(token, metadata).subscribe({
                next: () => {
                    this.logger.debug('exchanged public token')
                    this.alertSvc.addSuccessAlert(
                        'Success linking institution',
                        ['Loading your accounts now']
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
        } else if (linkUpdateType === LinkUpdateTypeEnum.Required) {
            this.removeLinkNotifications(
                itemId!,
                NotificationTypeEnum.LinkUpdateRequired
            )
        } else if (linkUpdateType === LinkUpdateTypeEnum.Optional) {
            this.removeLinkNotifications(
                itemId!,
                NotificationTypeEnum.LinkUpdateOptional
            )
        } else {
            this.removeLinkNotifications(
                itemId!,
                NotificationTypeEnum.LinkUpdateOptionalNewAccounts
            )
        }
    }

    removeLinkNotifications(itemId: number, type: NotificationTypeEnum): void {
        this.logger.debug('removing notifications', itemId, type)
        this.notificationSvc
            .getNotifications()
            .pipe(
                switchMap((notifications) => {
                    return of(
                        notifications
                            .filter((n) => n.itemId === itemId)
                            .filter((n) => n.typeId === type)
                    )
                })
            )
            .subscribe((notifications) => {
                this.notificationSvc
                    .updateNotificationsToInactive(notifications)
                    .subscribe()
            })
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
        const lastRefreshed = item.lastRefreshed
            ? new Date(item.lastRefreshed)
            : null
        const lastRefreshTime = lastRefreshed ? lastRefreshed.getTime() : 0
        if (Date.now() - lastRefreshTime < refreshCooldown) {
            const nextRefresh = new Date(
                lastRefreshTime + refreshCooldown
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

    getDisplayDate(date: Date): string {
        return new Date(date).toLocaleString()
    }

    getDisplayCurrentBalance(acc: Account): string {
        return this.currencySvc.formatAmount(
            acc.currentBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getDisplayAvailableBalance(acc: Account): string {
        return this.currencySvc.formatAmount(
            acc.availableBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }
}
