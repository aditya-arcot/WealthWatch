import { CommonModule } from '@angular/common'
import { Component, Injector, OnInit, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Params, Router } from '@angular/router'
import {
    catchError,
    debounceTime,
    finalize,
    Subject,
    Subscription,
    switchMap,
    throwError,
} from 'rxjs'
import {
    Account,
    Category,
    CategoryEnum,
    ItemWithAccounts,
    Transaction,
} from 'wealthwatch-shared'
import { AccountFilterComponent } from '../../components/filters/account-filter/account-filter.component'
import { AmountFilterComponent } from '../../components/filters/amount-filter/amount-filter.component'
import { CategoryFilterComponent } from '../../components/filters/category-filter/category-filter.component'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../../components/logger.component'
import { NoteComponent } from '../../components/note/note.component'
import { AmountFilterEnum, DateFilterEnum } from '../../enums/filter'
import { categoryIconMap } from '../../maps/category'
import { TransactionsRequestParams } from '../../models/transaction'
import { AlertService } from '../../services/alert.service'
import { CategoryService } from '../../services/category.service'
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { TransactionService } from '../../services/transaction.service'
import {
    checkDatesEqual,
    checkDateStringValid,
    formatDate,
} from '../../utilities/date.utility'
import { computeDatesBasedOnFilter } from '../../utilities/filter.utility'
import {
    safeParseFloat,
    safeParseInt,
    safeParseIntArrayOrUndefinedFromParam,
} from '../../utilities/number.utility'
import { redirectWithParams } from '../../utilities/redirect.utility'

@Component({
    selector: 'app-transactions',
    imports: [
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
export class TransactionsComponent extends LoggerComponent implements OnInit {
    @ViewChild(NoteComponent) noteComponent!: NoteComponent
    noteUpdateSubscription: Subscription | null = null

    loading = false

    transactions: Transaction[] = []
    categories: Category[] = []
    itemsWithAccounts: ItemWithAccounts[] = []
    accounts: Account[] = []

    pageSizes = [10, 25, 50, 100]
    pageSizeIdx = 0
    page = 1

    searchSubject = new Subject<string>()
    searchText = ''
    previousSearchText = ''

    dateFilterType = DateFilterEnum
    selectedDateFilter: DateFilterEnum = DateFilterEnum.All
    startDate: Date | null = null
    endDate: Date | null = null

    amountFilterType = AmountFilterEnum
    selectedAmountFilter: AmountFilterEnum = AmountFilterEnum.All
    minAmount: number | null = null
    maxAmount: number | null = null

    selectedCategoryIds: Set<number> = new Set<number>()
    selectedAccountIds: Set<number> = new Set<number>()

    totalCount = -1
    filteredCount: number | null = null

    maxNameLength = 30

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private alertSvc: AlertService,
        private categorySvc: CategoryService,
        private currencySvc: CurrencyService,
        private itemSvc: ItemService,
        private transactionSvc: TransactionService,
        injector: Injector
    ) {
        super(injector, 'TransactionsComponent')
    }

    ngOnInit(): void {
        this.loadData().subscribe((items) => {
            this.itemsWithAccounts = items
            this.accounts = items.flatMap((item) => item.accounts)
            this.selectedCategoryIds = new Set(this.categories.map((c) => c.id))
            this.selectedAccountIds = new Set(this.accounts.map((a) => a.id))
            this.route.queryParams.subscribe((params) => {
                if (Object.keys(params).length > 0) {
                    this.processParams(params)
                }
                this.reloadTransactions()
            })
        })
        this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
            redirectWithParams(this.router, this.route, {
                page: 1,
                query: this.searchText,
            })
        })
    }

    loadData() {
        this.logger.info('loading data')
        this.loading = true
        return this.categorySvc.getCategories().pipe(
            switchMap((categories) => {
                this.categories = categories
                return this.itemSvc.getItemsWithAccounts()
            }),
            catchError((err) => {
                this.alertSvc.addErrorAlert(this.logger, 'Failed to load data')
                return throwError(() => err)
            }),
            finalize(() => (this.loading = false))
        )
    }

    reloadTransactions(): void {
        this.logger.info('reloading transactions')
        this.loading = true

        const limit = this.pageSizes[this.pageSizeIdx]
        const offset = (this.page - 1) * limit
        const req: TransactionsRequestParams = {
            searchQuery: this.searchText,
            startDate: this.startDate,
            endDate: this.endDate,
            minAmount: this.minAmount,
            maxAmount: this.maxAmount,
            limit,
            offset,
        }
        if (this.categories.length !== this.selectedCategoryIds.size) {
            req.categoryIds = this.selectedCategoryIds
        }
        if (this.accounts.length !== this.selectedAccountIds.size) {
            req.accountIds = this.selectedAccountIds
        }

        this.transactionSvc
            .getTransactions(req)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to reload transactions'
                    )
                    this.clearFilters()
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((resp) => {
                this.transactions = resp.transactions
                this.filteredCount = resp.filteredCount
                this.totalCount = resp.totalCount

                const totalPages = this.getTotalPages()
                if (totalPages === 0) {
                    this.page = 1
                } else if (this.page > totalPages) {
                    redirectWithParams(this.router, this.route, {
                        page: totalPages,
                    })
                }
            })
    }

    refreshTransactions(): void {
        this.logger.info('refreshing transactions')
        this.loading = true
        this.transactionSvc
            .refreshTransactions()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to refresh transactions'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    'Refreshing transactions',
                    'Please check back later'
                )
            })
    }

    processParams(params: Params): void {
        this.logger.info('processing params', { params })

        const page: string | undefined = params['page']
        if (page !== undefined) {
            const pageInt = safeParseInt(page)
            if (pageInt === undefined || pageInt < 1) {
                this.page = 1
            } else {
                this.page = pageInt
            }
        }

        const pageSizeIdx: string | undefined = params['pageSize']
        if (pageSizeIdx !== undefined) {
            const pageSizeIdxInt = safeParseInt(pageSizeIdx)
            if (pageSizeIdxInt === undefined || pageSizeIdxInt < 0) {
                this.pageSizeIdx = 0
            } else if (pageSizeIdxInt >= this.pageSizes.length) {
                this.pageSizeIdx = this.pageSizes.length - 1
            } else {
                this.pageSizeIdx = pageSizeIdxInt
            }
        }

        const query: string | undefined = params['query']
        if (query !== undefined) {
            this.searchText = query
        }

        const dateFilter: string | undefined = params['dateFilter']
        if (dateFilter !== undefined) {
            const dateFilterInt = safeParseInt(dateFilter)
            if (dateFilterInt !== undefined) {
                this.selectedDateFilter = dateFilterInt
                if (this.selectedDateFilter === DateFilterEnum.Custom) {
                    let dateSet = false

                    const startDate: string | undefined = params['startDate']
                    if (
                        startDate !== undefined &&
                        checkDateStringValid(startDate)
                    ) {
                        this.startDate = new Date(`${startDate}T00:00:00`)
                        dateSet = true
                    }

                    const endDate: string | undefined = params['endDate']
                    if (
                        endDate !== undefined &&
                        checkDateStringValid(endDate)
                    ) {
                        this.endDate = new Date(`${endDate}T00:00:00`)
                        dateSet = true
                    }

                    if (!dateSet) {
                        this.selectedDateFilter = DateFilterEnum.All
                    }
                } else {
                    const { startDate, endDate } = computeDatesBasedOnFilter(
                        this.selectedDateFilter
                    )
                    this.startDate = startDate
                    this.endDate = endDate
                }
            }
        }

        const minAmount: string | undefined = params['min']
        let minAmountFloat: number | undefined
        if (minAmount !== undefined) {
            minAmountFloat = safeParseFloat(minAmount)
        }

        const maxAmount: string | undefined = params['max']
        let maxAmountFloat: number | undefined
        if (maxAmount !== undefined) {
            maxAmountFloat = safeParseFloat(maxAmount)
        }

        if (minAmountFloat !== undefined && maxAmountFloat !== undefined) {
            if (minAmountFloat === maxAmountFloat) {
                this.selectedAmountFilter = AmountFilterEnum.Exactly
                this.minAmount = minAmountFloat
                this.maxAmount = maxAmountFloat
            } else if (minAmountFloat <= maxAmountFloat) {
                this.selectedAmountFilter = AmountFilterEnum.Between
                this.minAmount = minAmountFloat
                this.maxAmount = maxAmountFloat
            } else {
                this.selectedAmountFilter = AmountFilterEnum.GreaterThan
                this.minAmount = minAmountFloat
            }
        } else if (minAmountFloat !== undefined) {
            this.selectedAmountFilter = AmountFilterEnum.GreaterThan
            this.minAmount = minAmountFloat
        } else if (maxAmountFloat !== undefined) {
            this.selectedAmountFilter = AmountFilterEnum.LessThan
            this.maxAmount = maxAmountFloat
        }

        const categoryIds = params['categoryId']
        if (categoryIds !== undefined) {
            const categoryIdNums =
                safeParseIntArrayOrUndefinedFromParam(categoryIds)
            if (categoryIdNums !== undefined && categoryIdNums.length > 0) {
                const filteredIds = categoryIdNums.filter(
                    (id) =>
                        this.categories.find((c) => c.id === id) !== undefined
                )
                if (filteredIds.length > 0) {
                    this.selectedCategoryIds = new Set(filteredIds)
                }
            }
        }

        const accountIds = params['accountId']
        if (accountIds !== undefined) {
            const accountIdNums =
                safeParseIntArrayOrUndefinedFromParam(accountIds)
            if (accountIdNums !== undefined && accountIdNums.length > 0) {
                const filteredIds = accountIdNums.filter(
                    (id) => this.accounts.find((a) => a.id === id) !== undefined
                )
                if (filteredIds.length > 0) {
                    this.selectedAccountIds = new Set(filteredIds)
                }
            }
        }
    }

    updateCustomName(transaction: Transaction, reset = false): void {
        this.logger.info('updating custom name', { transaction, reset })
        this.transactionSvc
            .updateTransactionCustomName(transaction)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        reset
                            ? 'Failed to reset transaction name'
                            : 'Failed to update transaction name'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    reset
                        ? 'Reset transaction name'
                        : 'Updated transaction name'
                )
            })
    }

    updateCustomCategoryId(transaction: Transaction, reset = false): void {
        this.logger.info('updating custom category id', { transaction, reset })
        this.transactionSvc
            .updateTransactionCustomCategoryId(transaction)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        reset
                            ? 'Failed to reset transaction category'
                            : 'Failed to update transaction category'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    reset
                        ? 'Reset transaction category'
                        : 'Updated transaction category'
                )
            })
    }

    updateNote(transaction: Transaction): void {
        this.logger.info('updating note', { transaction })
        this.transactionSvc
            .updateTransactionNote(transaction)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to update transaction note'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    'Updated transaction note'
                )
            })
    }

    getPageSize(): number {
        return this.pageSizes[this.pageSizeIdx]
    }

    updatePageSize(target: EventTarget | null): void {
        if (!target) return
        const element = target as HTMLSelectElement
        redirectWithParams(this.router, this.route, {
            page: 1,
            pageSize: element.selectedIndex,
        })
    }

    getTotalPages(): number {
        return Math.ceil(
            (this.filteredCount ?? this.totalCount) / this.getPageSize()
        )
    }

    getStartTransactionNumber(): number {
        return this.getPageSize() * (this.page - 1) + 1
    }

    getEndTransactionNumber(): number {
        if (this.page === this.getTotalPages()) {
            return this.filteredCount ?? this.totalCount
        }
        return this.getPageSize() * this.page
    }

    navigateToFirstPage(): void {
        if (this.page === 1) return
        redirectWithParams(this.router, this.route, { page: 1 })
    }

    navigateToPreviousPage(): void {
        if (this.page === 1) return
        const page = this.page - 1
        redirectWithParams(this.router, this.route, { page })
    }

    navigateToNextPage(): void {
        if (this.page === this.getTotalPages()) return
        const page = this.page + 1
        redirectWithParams(this.router, this.route, { page })
    }

    navigateToLastPage(): void {
        const totalPages = this.getTotalPages()
        if (this.page === totalPages) return
        redirectWithParams(this.router, this.route, { page: totalPages })
    }

    search(): void {
        const modifiedSearchText = this.searchText.trim().toLowerCase()
        if (modifiedSearchText === this.previousSearchText) return
        this.previousSearchText = modifiedSearchText
        this.searchSubject.next(modifiedSearchText)
    }

    applyDateFilter(
        filter: DateFilterEnum,
        start: Date | null,
        end: Date | null
    ): void {
        if (filter !== DateFilterEnum.Custom) {
            this.selectedDateFilter = filter
            redirectWithParams(this.router, this.route, {
                page: 1,
                dateFilter: filter,
            })
            return
        }

        this.selectedDateFilter = filter
        let reload = false
        if (!checkDatesEqual(start, this.startDate)) {
            this.startDate = start ? new Date(start) : null
            reload = true
        }
        if (!checkDatesEqual(end, this.endDate)) {
            this.endDate = end ? new Date(end) : null
            reload = true
        }
        if (reload) {
            const startDate = this.startDate?.toISOString().slice(0, 10)
            const endDate = this.endDate?.toISOString().slice(0, 10)
            redirectWithParams(this.router, this.route, {
                page: 1,
                dateFilter: filter,
                startDate,
                endDate,
            })
        }
    }

    applyAmountFilter(
        filter: AmountFilterEnum,
        min: number | null,
        max: number | null
    ): void {
        this.selectedAmountFilter = filter
        let reload = false
        if (min !== this.minAmount) {
            this.minAmount = min
            reload = true
        }
        if (max !== this.maxAmount) {
            this.maxAmount = max
            reload = true
        }
        if (reload) {
            redirectWithParams(this.router, this.route, {
                page: 1,
                min: this.minAmount,
                max: this.maxAmount,
            })
        }
    }

    applyCategoryFilter(ids: Set<number>): void {
        if (
            ids.size !== this.selectedCategoryIds.size ||
            ![...ids].every((value) => this.selectedCategoryIds.has(value))
        ) {
            if (ids.size === 0) {
                ids = new Set(this.categories.map((c) => c.id))
            }
            this.selectedCategoryIds = new Set(ids)
            redirectWithParams(this.router, this.route, {
                page: 1,
                categoryId: [...ids],
            })
        }
    }

    applyAccountFilter(ids: Set<number>): void {
        if (
            ids.size !== this.selectedAccountIds.size ||
            ![...ids].every((value) => this.selectedAccountIds.has(value))
        ) {
            if (ids.size === 0) {
                ids = new Set(this.accounts.map((a) => a.id))
            }
            this.selectedAccountIds = new Set(ids)
            redirectWithParams(this.router, this.route, {
                page: 1,
                accountId: [...ids],
            })
        }
    }

    resultsFiltered(): boolean {
        return this.filteredCount !== null
    }

    filterActive(): boolean {
        return (
            this.searchText.length > 0 ||
            this.selectedDateFilter !== DateFilterEnum.All ||
            this.selectedAmountFilter !== AmountFilterEnum.All ||
            this.selectedCategoryIds.size !== this.categories.length ||
            this.selectedAccountIds.size !== this.accounts.length
        )
    }

    clearFilters(): void {
        this.previousSearchText = this.searchText
        this.searchText = ''

        this.selectedDateFilter = DateFilterEnum.All
        this.startDate = null
        this.endDate = null

        this.selectedAmountFilter = AmountFilterEnum.All
        this.minAmount = null
        this.maxAmount = null

        this.selectedCategoryIds = new Set(this.categories.map((c) => c.id))
        this.selectedAccountIds = new Set(this.accounts.map((a) => a.id))

        redirectWithParams(
            this.router,
            this.route,
            { page: 1, pageSize: this.pageSizeIdx },
            false
        )
    }

    getDateString(t: Transaction): string {
        return formatDate(t.date, true, false)
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
        this.updateCustomName(t, true)
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

    getCategoryId(t: Transaction): CategoryEnum {
        return t.customCategoryId ?? t.categoryId
    }

    updateCategory(target: EventTarget | null, t: Transaction): void {
        if (!target) return
        const element = target as HTMLInputElement
        const newCategoryId = safeParseInt(element.value.trim())

        if (newCategoryId === undefined || t.categoryId === newCategoryId) {
            t.customCategoryId = null
        } else {
            t.customCategoryId = newCategoryId
        }

        this.updateCustomCategoryId(t)
    }

    resetCategory(t: Transaction): void {
        if (t.customCategoryId === null) return
        t.customCategoryId = null
        this.updateCustomCategoryId(t, true)
    }

    getCategoryClass(t: Transaction): string {
        return categoryIconMap[this.getCategoryId(t)]
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
        return account?.name ?? ''
    }

    getInstitutionName(t: Transaction): string {
        for (const item of this.itemsWithAccounts) {
            if (item.accounts.some((a) => a.id === t.accountId)) {
                return item.institutionName
            }
        }
        return ''
    }
}
