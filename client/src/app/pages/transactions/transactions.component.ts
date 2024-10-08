import { CommonModule, DatePipe, DecimalPipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
    catchError,
    debounceTime,
    Observable,
    of,
    Subject,
    Subscription,
    switchMap,
    throwError,
} from 'rxjs'
import { AccountFilterComponent } from '../../components/filters/account-filter/account-filter.component'
import { AmountFilterComponent } from '../../components/filters/amount-filter/amount-filter.component'
import { CategoryFilterComponent } from '../../components/filters/category-filter/category-filter.component'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { NoteComponent } from '../../components/note/note.component'
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
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { LoggerService } from '../../services/logger.service'
import { TransactionService } from '../../services/transaction.service'
import { checkDatesEqual } from '../../utilities/date.utility'

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
        AccountFilterComponent,
        NoteComponent,
        CommonModule,
    ],
    templateUrl: './transactions.component.html',
    styleUrl: './transactions.component.css',
})
export class TransactionsComponent implements OnInit {
    @ViewChild(NoteComponent) noteComponent!: NoteComponent
    noteUpdateSubscription: Subscription | null = null

    loading = false

    transactions: Transaction[] = []
    categories: Category[] = []
    accounts: Account[] = []
    items: Item[] = []

    pageSizes = [10, 25, 50, 100]
    pageSizeIndex = 0
    currentPage = 1

    searchSubject = new Subject<string>()
    searchText = ''
    previousSearchText = ''

    dateFilterType = DateFilterEnum
    selectedDateFilter: DateFilterEnum = DateFilterEnum.ALL
    previousStartDate: Date | null = null
    startDate: Date | null = null
    previousEndDate: Date | null = null
    endDate: Date | null = null

    amountFilterType = AmountFilterEnum
    selectedAmountFilter: AmountFilterEnum = AmountFilterEnum.ALL
    previousMinAmount: number | null = null
    minAmount: number | null = null
    previousMaxAmount: number | null = null
    maxAmount: number | null = null

    selectedCategoryIds: Set<number> = new Set<number>()
    selectedAccountIds: Set<number> = new Set<number>()

    totalCount = -1
    filteredCount: number | null = null

    maxNameLength = 30

    constructor(
        private transactionSvc: TransactionService,
        private categorySvc: CategoryService,
        private accountSvc: AccountService,
        private itemSvc: ItemService,
        private logger: LoggerService,
        private alertSvc: AlertService,
        private currencySvc: CurrencyService
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
            .subscribe(() => {
                this.selectedCategoryIds = new Set(
                    this.categories.map((c) => c.id)
                )
                this.selectedAccountIds = new Set(
                    this.accounts.map((a) => a.id)
                )
                this.loading = false
            })
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
            accountIds: this.selectedAccountIds,
            limit,
            offset,
        }
        return this.transactionSvc
            .getTransactions(req, this.categories.length, this.accounts.length)
            .pipe(
                switchMap((t) => {
                    this.logger.debug('loaded transactions', t)
                    this.transactions = t.transactions
                    this.filteredCount = t.filteredCount
                    this.totalCount = t.totalCount
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

    updateNote(t: Transaction): void {
        this.transactionSvc
            .updateTransactionNote(t)
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Failed to update transaction note'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert('Updated transaction note')
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
        const modifiedSearchText = this.searchText.trim().toLowerCase()
        if (modifiedSearchText === this.previousSearchText) return
        this.previousSearchText = modifiedSearchText

        this.currentPage = 1
        this.searchSubject.next(modifiedSearchText)
    }

    applyDateFilter(
        filter: DateFilterEnum,
        start: Date | null,
        end: Date | null
    ): void {
        this.selectedDateFilter = filter
        let reload = false
        if (!checkDatesEqual(start, this.previousStartDate)) {
            this.previousStartDate = start ? new Date(start) : null
            this.startDate = start ? new Date(start) : null
            reload = true
        }
        if (!checkDatesEqual(end, this.previousEndDate)) {
            this.previousEndDate = end ? new Date(end) : null
            this.endDate = end ? new Date(end) : null
            reload = true
        }
        if (reload) {
            this.currentPage = 1
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
            this.currentPage = 1
            this.reloadTransactions()
        }
    }

    applyCategoryFilter(ids: Set<number>): void {
        if (
            ids.size !== this.selectedCategoryIds.size ||
            ![...ids].every((value) => this.selectedCategoryIds!.has(value))
        ) {
            if (ids.size === 0) {
                ids = new Set(this.categories.map((c) => c.id))
            }
            this.selectedCategoryIds = new Set(ids)
            this.currentPage = 1
            this.reloadTransactions()
        }
    }

    applyAccountFilter(ids: Set<number>): void {
        if (
            ids.size !== this.selectedAccountIds.size ||
            ![...ids].every((value) => this.selectedAccountIds!.has(value))
        ) {
            if (ids.size === 0) {
                ids = new Set(this.accounts.map((a) => a.id))
            }
            this.selectedAccountIds = new Set(ids)
            this.currentPage = 1
            this.reloadTransactions()
        }
    }

    resultsFiltered(): boolean {
        return this.filteredCount !== null
    }

    filterActive(): boolean {
        return (
            this.searchText.length > 0 ||
            this.selectedDateFilter !== DateFilterEnum.ALL ||
            this.selectedAmountFilter !== AmountFilterEnum.ALL ||
            this.selectedCategoryIds.size !== this.categories.length ||
            this.selectedAccountIds.size !== this.accounts.length
        )
    }

    clearFilters(): void {
        this.previousSearchText = this.searchText
        this.searchText = ''

        this.selectedDateFilter = DateFilterEnum.ALL
        this.previousStartDate = this.startDate
            ? new Date(this.startDate)
            : null
        this.startDate = null
        this.previousEndDate = this.endDate ? new Date(this.endDate) : null
        this.endDate = null

        this.selectedAmountFilter = AmountFilterEnum.ALL
        this.previousMinAmount = this.minAmount
        this.minAmount = null
        this.previousMaxAmount = this.maxAmount
        this.maxAmount = null

        this.selectedCategoryIds = new Set(this.categories.map((c) => c.id))
        this.selectedAccountIds = new Set(this.accounts.map((a) => a.id))

        this.currentPage = 1
        this.reloadTransactions()
    }

    getDateString(t: Transaction): string {
        return new Date(t.date).toLocaleDateString(undefined, {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
        })
    }

    getShortenedName(t: Transaction): string {
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

    showShortenedName(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        element.value = this.getShortenedName(t)
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

    resetName(t: Transaction): void {
        if (t.customName === null) return
        t.customName = null
        this.updateCustomName(t)
    }

    getAmountString(t: Transaction): string {
        const negative = t.amount < 0
        const formatted = this.currencySvc.format(
            Math.abs(t.amount),
            t.unofficialCurrencyCode ?? t.isoCurrencyCode
        )
        if (negative) return `+${formatted}`
        return formatted
    }

    getCategoryId(t: Transaction): number {
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

    getCategoryClass(t: Transaction): string {
        const categoryId = this.getCategoryId(t) as CategoryEnum
        return categoryIcons[categoryId]
    }

    openNoteModal(t: Transaction): void {
        this.noteComponent.note = t.note
        this.noteComponent.originalNote = t.note

        if (this.noteUpdateSubscription)
            this.noteUpdateSubscription.unsubscribe()
        this.noteUpdateSubscription = this.noteComponent.noteUpdated.subscribe(
            (newNote) => {
                newNote = newNote?.trim() ?? null
                if (!newNote?.length) newNote = null
                if (newNote === t.note) return
                t.note = newNote
                this.updateNote(t)

                this.noteComponent.note = null
                this.noteComponent.originalNote = null
            }
        )
    }

    getAccountName(t: Transaction): string {
        const account = this.accounts.find((a) => a.id === t.accountId)
        if (!account) {
            this.logger.error('unrecognized account id', t.accountId)
            return ''
        }
        return account.name
    }

    getInstitutionName(t: Transaction): string {
        const account = this.accounts.find((a) => a.id === t.accountId)
        if (!account) {
            this.logger.error('unrecognized account id', t.accountId)
            return ''
        }

        const item = this.items.find((i) => i.id === account.itemId)
        if (!item) {
            this.logger.error('unrecognized item id', account.itemId)
            return ''
        }

        return item.institutionName
    }
}
