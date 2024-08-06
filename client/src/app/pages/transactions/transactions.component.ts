import { DatePipe, DecimalPipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import { Category } from '../../models/category'
import { Item } from '../../models/item'
import { Transaction } from '../../models/transaction'
import { AccountService } from '../../services/account.service'
import { AlertService } from '../../services/alert.service'
import { CategoryService } from '../../services/category.service'
import { ItemService } from '../../services/item.service'
import { LoggerService } from '../../services/logger.service'
import { TransactionService } from '../../services/transaction.service'

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [DecimalPipe, DatePipe, LoadingSpinnerComponent],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    maxNameLength = 30
    transactions: Transaction[] = []
    categories: Category[] = []
    accounts: Account[] = []
    items: Item[] = []
    currencyFormatters: Record<string, Intl.NumberFormat> = {
        USD: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }),
    }
    loading = false

    constructor(
        private transactionSvc: TransactionService,
        private categorySvc: CategoryService,
        private accountSvc: AccountService,
        private itemSvc: ItemService,
        private logger: LoggerService,
        private alertSvc: AlertService
    ) {}

    ngOnInit(): void {
        this.loadData()
    }

    loadData(): void {
        this.loading = true
        this.loadCategories()
            .pipe(
                switchMap(() => this.loadAccounts()),
                switchMap(() => this.loadItems()),
                switchMap(() => this.loadTransactions()),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to load data', [
                        err.message,
                    ])
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => (this.loading = false))
    }

    loadCategories(): Observable<void> {
        return this.categorySvc.getCategories().pipe(
            switchMap((categories) => {
                this.logger.debug('loaded categories', categories)
                this.categories = categories
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load categories', err)
                return throwError(() => err)
            })
        )
    }

    loadAccounts(): Observable<void> {
        return this.accountSvc.getAccounts().pipe(
            switchMap((accounts) => {
                this.logger.debug('loaded accounts', accounts)
                this.accounts = accounts
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load accounts', err)
                return throwError(() => err)
            })
        )
    }

    loadItems(): Observable<void> {
        return this.itemSvc.getItems().pipe(
            switchMap((items) => {
                this.logger.debug('loaded items', items)
                this.items = items
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load items', err)
                return throwError(() => err)
            })
        )
    }

    loadTransactions(): Observable<void> {
        return this.transactionSvc.getTransactions().pipe(
            switchMap((transactions) => {
                this.logger.debug('loaded transactions', transactions)
                this.transactions = transactions
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load transactions', err)
                return throwError(() => err)
            })
        )
    }

    formatName(t: Transaction): string {
        let name = t.customName ?? t.merchant ?? t.name
        if (name.length > this.maxNameLength)
            name = name.substring(0, this.maxNameLength) + '...'
        name = name.trim()
        if (t.pending) name += ' | Pending'
        return name
    }

    showFullName(event: FocusEvent, t: Transaction): void {
        ;(event.target as HTMLInputElement).value = (
            t.customName ??
            t.merchant ??
            t.name
        ).trim()
    }

    hideFullName(event: FocusEvent, t: Transaction): void {
        ;(event.target as HTMLInputElement).value = this.formatName(t)
    }

    updateName(event: Event, t: Transaction): void {
        let newName: string | null = (
            event.target as HTMLInputElement
        ).value.trim()
        if (!newName.length) newName = null

        const currentName = t.merchant ?? t.name
        if (newName === currentName) return

        t.customName = newName
        this.transactionSvc
            .updateTransactionCustomName(t)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Failed to update transaction name'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe()
    }

    formatCurrency(t: Transaction): string {
        const currency = t.unofficialCurrencyCode ?? t.isoCurrencyCode
        if (!currency) return t.amount.toString()

        if (!this.currencyFormatters[currency]) {
            this.currencyFormatters[currency] = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            })
        }

        return this.currencyFormatters[currency].format(t.amount)
    }

    getCategory(t: Transaction): string {
        const category = this.categories.find((c) => c.id === t.categoryId)
        if (!category) {
            return ''
        }
        return category.name
    }

    getAccount(t: Transaction): string {
        const account = this.accounts.find((a) => a.id === t.accountId)
        if (!account) {
            this.logger.error('unrecognized account id', t.accountId)
            return ''
        }

        const item = this.items.find((i) => i.id === account.itemId)
        if (!item) {
            this.logger.error('unrecognized item id', account.itemId)
            return account.name
        }

        return `${account.name} (${item.institutionName})`
    }
}
