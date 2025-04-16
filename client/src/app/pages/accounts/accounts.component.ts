import { Component, Injector, OnInit } from '@angular/core'
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
import {
    Account,
    Item,
    itemInCooldown,
    itemRefreshCooldown,
    ItemWithAccounts,
    PlaidLinkEvent,
} from 'wealthwatch-shared'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../../components/logger.component'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { LinkService } from '../../services/link.service'
import { UserService } from '../../services/user.service'
import { parseBoolean } from '../../utilities/boolean.utility'
import { formatDate } from '../../utilities/date.utility'
import { safeParseInt } from '../../utilities/number.utility'

@Component({
    selector: 'app-accounts',
    imports: [LoadingSpinnerComponent],
    templateUrl: './accounts.component.html',
})
export class AccountsComponent extends LoggerComponent implements OnInit {
    itemsWithAccounts: ItemWithAccounts[] = []
    loading = false

    constructor(
        private userSvc: UserService,
        private linkSvc: LinkService,
        private plaidLinkSvc: NgxPlaidLinkService,
        private alertSvc: AlertService,
        private itemSvc: ItemService,
        private currencySvc: CurrencyService,
        private route: ActivatedRoute,
        private router: Router,
        injector: Injector
    ) {
        super(injector, 'AccountsComponent')
    }

    ngOnInit(): void {
        this.loadAccounts()
        this.route.queryParams.subscribe((params) => {
            const itemId: string | undefined = params['itemId']
            if (itemId === undefined) return
            const itemIdNum = safeParseInt(itemId)
            if (itemIdNum === undefined) throw Error('invalid item id')

            const withAccounts: string | undefined = params['withAccounts']
            if (withAccounts === undefined) throw Error('missing with accounts')
            const withAccountsBool = parseBoolean(withAccounts)

            this.linkInstitution(itemIdNum, withAccountsBool)
        })
    }

    loadAccounts(): void {
        this.logger.info('loading accounts')
        this.loading = true
        this.itemSvc
            .getItemsWithAccounts()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to load accounts'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((items) => (this.itemsWithAccounts = items))
    }

    linkInstitution(itemId?: number, withAccounts?: boolean): void {
        this.logger.info('linking institution', { itemId, withAccounts })
        this.loading = true
        this.linkSvc
            .createLinkToken(itemId, withAccounts)
            .pipe(
                switchMap((resp) =>
                    this.constructPlaidLinkHandler(
                        resp.linkToken,
                        itemId,
                        withAccounts
                    )
                ),
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to create link token'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((handler: PlaidLinkHandler) => {
                handler.open()
            })
    }

    constructPlaidLinkHandler(
        token: string,
        itemId?: number,
        withAccounts?: boolean
    ): Promise<PlaidLinkHandler> {
        this.logger.info('constructing plaid link handler', {
            token,
            itemId,
            withAccounts,
        })
        const config: PlaidConfig = {
            token,
            onSuccess: (token: string, metadata: PlaidSuccessMetadata) =>
                this.handleLinkSuccess(token, metadata, itemId, withAccounts),
            onExit: (error: PlaidErrorObject, metadata: PlaidErrorMetadata) =>
                this.handleLinkExit(error, metadata, itemId),
            onEvent: (eventName: string, metadata: PlaidEventMetadata) =>
                this.handleLinkEvent(eventName, metadata),
        }
        return this.plaidLinkSvc.createPlaid(config)
    }

    handleLinkSuccess(
        token: string,
        metadata: PlaidSuccessMetadata,
        itemId?: number,
        withAccounts?: boolean
    ): void {
        this.logger.info('handling link success', {
            token,
            metadata,
            itemId,
            withAccounts,
        })
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.user?.id ?? -1,
            timestamp: new Date(),
            type: 'success',
            sessionId: metadata.link_session_id,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            publicToken: metadata.public_token,
            status: metadata.transfer_status,
        }
        this.linkSvc.handleLinkEvent(event).subscribe()

        if (itemId === undefined) {
            this.exchangePublicToken(token, metadata)
        } else {
            this.handleLinkUpdateComplete(itemId, withAccounts)
        }
    }

    exchangePublicToken = (token: string, metadata: PlaidSuccessMetadata) => {
        this.logger.info('exchanging public token', { token, metadata })
        this.loading = true
        this.linkSvc
            .exchangePublicToken(token, metadata)
            .pipe(
                catchError((err) => {
                    if (err.status === 409) {
                        this.alertSvc.addErrorAlert(
                            this.logger,
                            'This institution has already been linked'
                        )
                    } else {
                        this.alertSvc.addErrorAlert(
                            this.logger,
                            'Failed to exchange public token'
                        )
                    }
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                // don't disable loading flag
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    'Success linking institution',
                    'Loading account data'
                )
                setTimeout(() => this.loadAccounts(), 3000)
            })
    }

    handleLinkUpdateComplete = (itemId: number, withAccounts?: boolean) => {
        this.logger.info('handling link update complete', {
            itemId,
            withAccounts,
        })
        this.loading = true
        this.linkSvc
            .handleLinkUpdateComplete(itemId, withAccounts)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to complete link update'
                    )
                    this.loading = false
                    return throwError(() => err)
                }),
                finalize(() => void this.router.navigateByUrl('/accounts'))
            )
            .subscribe(() => {
                // don't disable loading flag
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    'Success linking institution',
                    'Loading account data'
                )
                setTimeout(() => this.loadAccounts(), 3000)
            })
    }

    handleLinkExit(
        error: PlaidErrorObject | null,
        metadata: PlaidErrorMetadata,
        itemId?: number
    ): void {
        this.logger.info('handling link exit', { error, metadata, itemId })
        if (itemId !== undefined) {
            void this.router.navigateByUrl('/accounts')
        }
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.user?.id ?? -1,
            timestamp: new Date(),
            type: 'exit',
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
        this.logger.info('handling link event', { eventName, metadata })
        const event: PlaidLinkEvent = {
            id: -1,
            userId: this.userSvc.user?.id ?? -1,
            timestamp: new Date(),
            type: `event - ${eventName.toLowerCase()}`,
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
        this.logger.info('adding accounts', { item })
        void this.router.navigate(['/accounts'], {
            queryParams: {
                itemId: item.id,
                withAccounts: true,
            },
        })
    }

    refreshItem(item: Item): void {
        this.logger.info('refreshing item', { item })
        if (itemInCooldown(item.lastRefreshed)) {
            const lastRefreshed = item.lastRefreshed
                ? new Date(item.lastRefreshed)
                : null
            const nextRefresh = new Date(
                (lastRefreshed?.getTime() ?? 0) + itemRefreshCooldown
            )
            const nextRefreshString = formatDate(nextRefresh, false, true)
            this.alertSvc.addErrorAlert(
                this.logger,
                `${item.institutionName} data was recently refreshed`,
                `Please wait until ${nextRefreshString} before refreshing again`
            )
            return
        }

        this.loading = true
        this.itemSvc
            .refreshItem(item.plaidId)
            .pipe(
                catchError((err) => {
                    if (err.status === 429) {
                        item.lastRefreshed = new Date()
                    }
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        `Failed to refresh ${item.institutionName} data`
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                item.lastRefreshed = new Date()
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    `Refreshing ${item.institutionName} data`,
                    'Please check back later'
                )
            })
    }

    deactivateItem(item: Item): void {
        this.logger.info('deactivating item', { item })
        if (!confirm('Are you sure you want to unlink this institution?')) {
            this.logger.info('canceled deactivating item')
            return
        }

        this.loading = true
        this.itemSvc
            .deactivateItem(item.plaidId)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        `Failed to remove ${item.institutionName} accounts`
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    `Removed ${item.institutionName} accounts`
                )
                this.loadAccounts()
            })
    }

    getLastRefreshedString(item: Item): string {
        return formatDate(item.lastRefreshed, true, true)
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
