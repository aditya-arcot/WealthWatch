import { DatePipe, DecimalPipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
    catchError,
    debounceTime,
    Observable,
    of,
    Subject,
    switchMap,
    throwError,
} from 'rxjs'
import { AmountFilterComponent } from '../../components/filters/amount-filter/amount-filter.component'
import { CategoryFilterComponent } from '../../components/filters/category-filter/category-filter.component'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account } from '../../models/account'
import { AmountFilterEnum } from '../../models/amountFilter'
import { Category, CategoryEnum, categoryIcons } from '../../models/category'
import { DateFilterEnum } from '../../models/dateFilter'
import { Item } from '../../models/item'
import {
    Transaction,
    TransactionsRequestParams,
} from '../../models/transaction'
import { AccountService } from '../../services/account.service'
import { AlertService } from '../../services/alert.service'
import { CategoryService } from '../../services/category.service'
import { ItemService } from '../../services/item.service'
import { LoggerService } from '../../services/logger.service'
import { TransactionService } from '../../services/transaction.service'

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [
        DecimalPipe,
        DatePipe,
        LoadingSpinnerComponent,
        FormsModule,
        DateFilterComponent,
        AmountFilterComponent,
        CategoryFilterComponent,
    ],
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

    searchSubject = new Subject<string | null>()
    searchText: string | null = null
    previousSearchText: string | null = null

    dateFilterType = DateFilterEnum
    selectedDateFilter: DateFilterEnum = DateFilterEnum.ALL
    previousStartDate: string | null = null
    startDate: string | null = null
    previousEndDate: string | null = null
    endDate: string | null = null

    amountFilterType = AmountFilterEnum
    selectedAmountFilter: AmountFilterEnum = AmountFilterEnum.ALL
    previousMinAmount: number | null = null
    minAmount: number | null = null
    previousMaxAmount: number | null = null
    maxAmount: number | null = null

    selectedCategoryIds: Set<number> = new Set<number>()

    totalCount = -1
    filteredCount: number | null = null

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
        this.searchSubject
            .pipe(debounceTime(300))
            .subscribe(() => this.reloadTransactions())
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
        const req: TransactionsRequestParams = {
            searchQuery: this.searchText,
            startDate: this.startDate,
            endDate: this.endDate,
            minAmount: this.minAmount,
            maxAmount: this.maxAmount,
            categoryIds: this.selectedCategoryIds,
            limit,
            offset,
        }
        return this.transactionSvc.getTransactions(req).pipe(
            switchMap((t) => {
                this.logger.debug('loaded transactions', t)
                this.totalCount = t.totalCount
                this.filteredCount = t.filteredCount
                this.transactions = t.transactions
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load transactions', err)
                return throwError(() => err)
            })
        )
    }

    reloadTransactions(): void {
        this.loading = true
        this.loadTransactions()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to reload transactions')
                    this.clearFilters()
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => (this.loading = false))
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

    updateCustomName(t: Transaction): void {
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
            .subscribe(() => {
                this.alertSvc.addSuccessAlert('Updated transaction name')
            })
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
            .subscribe(() => {
                this.alertSvc.addSuccessAlert('Updated transaction category')
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
        this.reloadTransactions()
    }

    getTotalPages(): number {
        if (this.resultsFiltered()) {
            return Math.ceil(this.filteredCount! / this.getPageSize())
        }
        return Math.ceil(this.totalCount / this.getPageSize())
    }

    getStartTransactionNumber(): number {
        return this.getPageSize() * (this.currentPage - 1) + 1
    }

    getEndTransactionNumber(): number {
        if (this.currentPage === this.getTotalPages()) {
            if (this.resultsFiltered()) {
                return this.filteredCount!
            }
            return this.totalCount
        }
        return this.getPageSize() * this.currentPage
    }

    navigateToFirstPage(): void {
        if (this.currentPage === 1) return
        this.currentPage = 1
        this.reloadTransactions()
    }

    navigateToPreviousPage(): void {
        if (this.currentPage === 1) return
        this.currentPage--
        if (this.currentPage < 1) this.currentPage = 1
        this.reloadTransactions()
    }

    navigateToNextPage(): void {
        if (this.currentPage === this.getTotalPages()) return
        this.currentPage++
        if (this.currentPage > this.getTotalPages())
            this.currentPage = this.getTotalPages()
        this.reloadTransactions()
    }

    navigateToLastPage(): void {
        if (this.currentPage === this.getTotalPages()) return
        this.currentPage = this.getTotalPages()
        this.reloadTransactions()
    }

    search(): void {
        const modifiedSearchText = this.searchText?.trim().toLowerCase() ?? null
        if (modifiedSearchText === this.previousSearchText) return
        this.previousSearchText = modifiedSearchText

        this.currentPage = 1

        this.searchSubject.next(modifiedSearchText)
    }

    applyDateFilter(
        filter: DateFilterEnum,
        start: string | null,
        end: string | null
    ): void {
        this.selectedDateFilter = filter
        let reload = false
        if (start !== this.previousStartDate) {
            this.previousStartDate = start
            this.startDate = start
            reload = true
        }
        if (end !== this.previousEndDate) {
            this.previousEndDate = end
            this.endDate = end
            reload = true
        }
        if (reload) {
            this.reloadTransactions()
        }
    }

    applyAmountFilter(
        filter: AmountFilterEnum,
        min: number | null,
        max: number | null
    ): void {
        this.selectedAmountFilter = filter
        let reload = false
        if (min !== this.previousMinAmount) {
            this.previousMinAmount = min
            this.minAmount = min
            reload = true
        }
        if (max !== this.previousMaxAmount) {
            this.previousMaxAmount = max
            this.maxAmount = max
            reload = true
        }
        if (reload) {
            this.reloadTransactions()
        }
    }

    applyCategoryFilter(ids: Set<number>): void {
        if (
            ids.size !== this.selectedCategoryIds.size ||
            ![...ids].every((value) => this.selectedCategoryIds!.has(value))
        ) {
            this.selectedCategoryIds = new Set(ids)
            this.reloadTransactions()
        }
    }

    resultsFiltered(): boolean {
        return this.filteredCount !== null
    }

    filterActive(): boolean {
        return (
            !!this.searchText ||
            this.selectedDateFilter !== DateFilterEnum.ALL ||
            this.selectedAmountFilter !== AmountFilterEnum.ALL ||
            this.selectedCategoryIds.size !== 0
        )
    }

    clearFilters(): void {
        this.previousSearchText = this.searchText
        this.searchText = null

        this.selectedDateFilter = DateFilterEnum.ALL
        this.previousStartDate = this.startDate
        this.startDate = null
        this.previousEndDate = this.endDate
        this.endDate = null

        this.selectedAmountFilter = AmountFilterEnum.ALL
        this.previousMinAmount = this.minAmount
        this.minAmount = null
        this.previousMaxAmount = this.maxAmount
        this.maxAmount = null

        this.selectedCategoryIds = new Set<number>()

        this.currentPage = 1

        this.reloadTransactions()
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
        if (newName === currentName) newName = null

        t.customName = newName
        this.updateCustomName(t)
    }

    getDisplayAmount(t: Transaction): string {
        const currency = t.unofficialCurrencyCode ?? t.isoCurrencyCode
        if (currency === null) return t.amount.toString()

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

    getCategoryClasses(t: Transaction): string {
        const categoryId = this.getDisplayCategory(t) as CategoryEnum
        return `bi ${categoryIcons[categoryId]}`
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
