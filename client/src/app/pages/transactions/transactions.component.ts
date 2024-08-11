import { DatePipe, DecimalPipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import { Category, CategoryEnum } from '../../models/category'
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
    styleUrl: './transactions.component.css',
})
export class TransactionsComponent implements OnInit {
    loading = false
    transactions: Transaction[] = []
    categories: Category[] = []
    accounts: Account[] = []
    items: Item[] = []

    pageSizes = [10, 25, 50, 100]
    pageSizeIndex = 0
    currentPage = 1
    totalTransactions = -1

    maxNameLength = 30
    currencyFormatters: Record<string, Intl.NumberFormat> = {
        USD: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }),
    }

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
        const limit = this.pageSizes[this.pageSizeIndex]
        const offset = (this.currentPage - 1) * limit
        return this.transactionSvc.getPaginatedTransactions(limit, offset).pipe(
            switchMap((paginatedTransactions) => {
                this.logger.debug('loaded transactions', paginatedTransactions)
                this.transactions = paginatedTransactions.transactions
                this.totalTransactions = paginatedTransactions.total
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load transactions', err)
                return throwError(() => err)
            })
        )
    }

    refreshTransactions(): void {
        this.loading = true
        this.transactionSvc
            .refreshTransactions()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Failed to refresh transactions'
                    )
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert('Refreshing transactions', [
                    'Please check back later',
                ])
                this.loading = false
            })
    }

    getPageSize(): number {
        return this.pageSizes[this.pageSizeIndex]
    }

    updatePageSize(target: EventTarget | null): void {
        if (!target) return
        const element = target as HTMLSelectElement
        this.pageSizeIndex = element.selectedIndex
        this.currentPage = 1
        this.loadTransactions().subscribe()
    }

    getTotalPages(): number {
        return Math.ceil(this.totalTransactions / this.getPageSize())
    }

    getStartTransactionNumber(): number {
        return this.getPageSize() * (this.currentPage - 1) + 1
    }

    getEndTransactionNumber(): number {
        if (this.currentPage === this.getTotalPages()) {
            return this.totalTransactions
        }
        return this.getPageSize() * this.currentPage
    }

    navigateToFirstPage(): void {
        if (this.currentPage === 1) return
        this.currentPage = 1
        this.loadTransactions().subscribe()
    }

    navigateToPreviousPage(): void {
        if (this.currentPage === 1) return
        this.currentPage--
        if (this.currentPage < 1) this.currentPage = 1
        this.loadTransactions().subscribe()
    }

    navigateToNextPage(): void {
        if (this.currentPage === this.getTotalPages()) return
        this.currentPage++
        if (this.currentPage > this.getTotalPages())
            this.currentPage = this.getTotalPages()
        this.loadTransactions().subscribe()
    }

    navigateToLastPage(): void {
        if (this.currentPage === this.getTotalPages()) return
        this.currentPage = this.getTotalPages()
        this.loadTransactions().subscribe()
    }

    getDisplayName(t: Transaction): string {
        let name = t.customName ?? t.merchant ?? t.name
        if (name.length > this.maxNameLength)
            name = name.substring(0, this.maxNameLength) + '...'
        return name.trim()
    }

    showFullName(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        element.value = (t.customName ?? t.merchant ?? t.name).trim()
    }

    showDisplayName(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        element.value = this.getDisplayName(t)
    }

    updateName(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        let newName: string | null = element.value.trim()
        if (!newName.length) newName = null

        const currentName = t.merchant ?? t.name
        if (newName === currentName) return

        t.customName = newName
        this.updateCustomName(t)
    }

    private updateCustomName(t: Transaction): void {
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

    getDisplayAmount(t: Transaction): string {
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

    getDisplayCategory(t: Transaction): number {
        return t.customCategoryId ?? t.categoryId
    }

    updateCategory(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        const newCategoryId = parseInt(element.value.trim())

        if (isNaN(newCategoryId) || t.categoryId === newCategoryId) {
            t.customCategoryId = null
        } else {
            t.customCategoryId = newCategoryId
        }

        this.updateCustomCategoryId(t)
    }

    resetCategory(t: Transaction): void {
        if (t.customCategoryId === null) return
        t.customCategoryId = null
        this.updateCustomCategoryId(t)
    }

    updateCustomCategoryId(t: Transaction): void {
        this.transactionSvc
            .updateTransactionCustomCategoryId(t)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Failed to update transaction category'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe()
    }

    getCategoryClasses(t: Transaction): string {
        const categoryId = this.getDisplayCategory(t) as CategoryEnum
        return `bi ${this.icons[categoryId]}`
    }

    getCategoryClassesTest(id: CategoryEnum): string {
        return `bi ${this.icons[id]}`
    }

    private icons: Record<CategoryEnum, string> = {
        [CategoryEnum.Uncategorized]: 'bi-question-circle',
        [CategoryEnum.Income]: 'bi-currency-dollar',
        [CategoryEnum.Transfer]: 'bi-arrow-left-right',
        [CategoryEnum.Deposit]: 'bi-bank',
        [CategoryEnum.Investment]: 'bi-graph-up',
        [CategoryEnum.Savings]: 'bi-piggy-bank',
        [CategoryEnum.LoanPayment]: 'bi-wallet',
        [CategoryEnum.CreditCardPayment]: 'bi-credit-card-2-front',
        [CategoryEnum.Fees]: 'bi-file-earmark-text',
        [CategoryEnum.Entertainment]: 'bi-controller',
        [CategoryEnum.FoodAndDrink]: 'bi-cup-straw',
        [CategoryEnum.Groceries]: 'bi-basket',
        [CategoryEnum.Merchandise]: 'bi-bag',
        [CategoryEnum.Medical]: 'bi-heart-pulse',
        [CategoryEnum.PersonalCare]: 'bi-person',
        [CategoryEnum.Services]: 'bi-tools',
        [CategoryEnum.Government]: 'bi-building',
        [CategoryEnum.Donations]: 'bi-heart',
        [CategoryEnum.Taxes]: 'bi-percent',
        [CategoryEnum.Transportation]: 'bi-car-front',
        [CategoryEnum.Travel]: 'bi-airplane',
        [CategoryEnum.Bills]: 'bi-receipt-cutoff',
    }

    getDisplayAccount(t: Transaction): string {
        const account = this.accounts.find((a) => a.id === t.accountId)
        if (!account) {
            this.logger.error('unrecognized account id', t.accountId)
            return ''
        }
        return account.name
    }

    getDisplayInstitution(t: Transaction): string {
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

        return item.institutionName
    }
}
