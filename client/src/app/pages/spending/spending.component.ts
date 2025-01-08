import { CommonModule } from '@angular/common'
import {
    Component,
    Injector,
    OnInit,
    QueryList,
    ViewChildren,
} from '@angular/core'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, finalize, switchMap, throwError } from 'rxjs'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../../components/logger.component'
import {
    Category,
    CategoryEnum,
    CategoryGroupEnum,
} from '../../models/category'
import { dateFilterDescriptions, DateFilterEnum } from '../../models/dateFilter'
import { CategorySummary, CategoryTotalByDate } from '../../models/spending'
import { AlertService } from '../../services/alert.service'
import { CategoryService } from '../../services/category.service'
import { CurrencyService } from '../../services/currency.service'
import { SpendingService } from '../../services/spending.service'
import { handleCheckboxSelect } from '../../utilities/checkbox.utility'
import {
    checkDatesEqual,
    checkDateStringValid,
    formatDate,
} from '../../utilities/date.utility'
import { computeDatesBasedOnFilter } from '../../utilities/filter.utility'
import {
    formatDecimalToPercent,
    safeParseFloat,
    safeParseInt,
} from '../../utilities/number.utility'
import { redirectWithParams } from '../../utilities/redirect.utility'

@Component({
    selector: 'app-spending',
    imports: [
        LoadingSpinnerComponent,
        BaseChartDirective,
        DateFilterComponent,
        CommonModule,
    ],
    templateUrl: './spending.component.html',
    styleUrl: './spending.component.css',
})
export class SpendingComponent extends LoggerComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>

    loading = false

    selectedDateFilter: DateFilterEnum = DateFilterEnum.CUSTOM
    startDate: Date | null = null
    defaultStartDate: Date | null = null
    endDate: Date | null = null
    defaultEndDate: Date | null = null

    categories: Category[] = []
    categorySummaries: CategorySummary[] = []
    dates: Date[] = []
    spendingCategoryTotalsByDate: CategoryTotalByDate[] = []

    includeBills = true
    incomeTotal: number | undefined = undefined
    incomeCount: number | undefined = undefined
    billsTotal: number | undefined = undefined
    billsCount: number | undefined = undefined
    spendingTotal = 0
    nonSpendingTotal = 0
    spendingCategorySummaries: CategorySummary[] = []
    nonSpendingCategorySummaries: CategorySummary[] = []

    barGraphLabels: string[] = []
    barGraphDatasets: {
        data: number[]
        label: string
    }[] = []
    barGraphOptions: ChartOptions<'bar'> = {
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Date',
                    font: {
                        size: 12,
                    },
                },
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Amount',
                    font: {
                        size: 12,
                    },
                },
                beginAtZero: true,
                ticks: {
                    callback: (value) => {
                        if (typeof value === 'number') {
                            return this.currencySvc.format(value, 'USD')
                        }
                        const parsed = safeParseFloat(value)
                        return this.currencySvc.format(parsed ?? null, 'USD')
                    },
                },
            },
        },
        plugins: {
            tooltip: {
                position: 'center',
                callbacks: {
                    title: (tooltipItems) => {
                        const date = tooltipItems[0].label
                        const category = tooltipItems[0].dataset.label
                        return `${category} (${date})`
                    },
                    label: (tooltipItem) => {
                        const val = tooltipItem.parsed.y
                        return ' ' + this.currencySvc.format(val, 'USD')
                    },
                },
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                },
            },
        },
    }

    pieChartLabels: string[] = []
    pieChartDataset: number[] = []
    pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const val = tooltipItem.parsed
                        return ' ' + this.currencySvc.format(val, 'USD')
                    },
                },
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                },
            },
            autocolors: {
                mode: 'data',
                customize: (context) => {
                    return {
                        background: context.colors.background,
                        border: 'white',
                    }
                },
            },
        },
    }

    constructor(
        private categorySvc: CategoryService,
        private currencySvc: CurrencyService,
        private alertSvc: AlertService,
        private spendingSvc: SpendingService,
        private route: ActivatedRoute,
        private router: Router,
        injector: Injector
    ) {
        super(injector, 'SpendingComponent')
    }

    ngOnInit(): void {
        this.defaultStartDate = new Date()
        this.defaultStartDate.setHours(0, 0, 0, 0)
        this.defaultStartDate.setDate(1)

        this.loadCategories().subscribe((categories) => {
            this.categories = categories
            this.route.queryParams.subscribe((params) => {
                if (
                    Object.keys(params).length === 0 ||
                    this.processParams(params)
                ) {
                    this.selectedDateFilter = DateFilterEnum.CURRENT_MONTH
                    this.startDate = this.defaultStartDate
                        ? new Date(this.defaultStartDate)
                        : null
                    this.endDate = this.defaultEndDate
                        ? new Date(this.defaultEndDate)
                        : null
                }
                this.loadSpendingData()
            })
        })
    }

    loadCategories() {
        this.logger.info('loading categories')
        this.loading = true
        return this.categorySvc.getCategories().pipe(
            catchError((err) => {
                this.alertSvc.addErrorAlert(
                    this.logger,
                    'Failed to load categories. Please try again'
                )
                this.loading = false
                return throwError(() => err)
            }),
            finalize(() => (this.loading = false))
        )
    }

    loadSpendingData(): void {
        this.logger.info('loading spending data')
        this.loading = true
        this.spendingSvc
            .getCategorySummaries(this.startDate, this.endDate)
            .pipe(
                switchMap((summaries) => {
                    this.categorySummaries = summaries
                    return this.spendingSvc.getSpendingCategoryTotalsByDate(
                        this.startDate,
                        this.endDate
                    )
                }),
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to load spending data. Please try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((resp) => {
                this.dates = resp.dates
                this.spendingCategoryTotalsByDate = resp.totals
                this.processSpendingData()
            })
    }

    processParams(params: Params): boolean {
        this.logger.info('processing params', { params })

        const dateFilter: string | undefined = params['dateFilter']
        if (dateFilter === undefined) return true

        const dateFilterInt = safeParseInt(dateFilter)
        if (dateFilterInt === undefined) return true

        this.selectedDateFilter = dateFilterInt
        if (this.selectedDateFilter === DateFilterEnum.CUSTOM) {
            let useDefault = true

            const startDate: string | undefined = params['startDate']
            if (startDate !== undefined && checkDateStringValid(startDate)) {
                this.startDate = new Date(`${startDate}T00:00:00`)
                useDefault = false
            }

            const endDate: string | undefined = params['endDate']
            if (endDate !== undefined && checkDateStringValid(endDate)) {
                this.endDate = new Date(`${endDate}T00:00:00`)
                useDefault = false
            }

            return useDefault
        }

        const { startDate, endDate } = computeDatesBasedOnFilter(
            this.selectedDateFilter
        )
        this.startDate = startDate
        this.endDate = endDate
        return false
    }

    processSpendingData(): void {
        this.logger.info('processing spending data')

        this.incomeTotal = undefined
        this.incomeCount = undefined
        this.billsTotal = undefined
        this.billsCount = undefined
        this.spendingTotal = 0
        this.nonSpendingTotal = 0
        this.spendingCategorySummaries = []
        this.nonSpendingCategorySummaries = []

        this.pieChartLabels = []
        this.pieChartDataset = []

        this.barGraphLabels = []
        this.barGraphDatasets = []

        this.categorySummaries.forEach((s) => {
            const category = this.categories.find((c) => c.id === s.categoryId)
            if (!category) return

            if (category.id === CategoryEnum.Income) {
                this.incomeTotal = s.total
                this.incomeCount = s.count
                return
            } else if (category.id === CategoryEnum.Bills) {
                this.billsTotal = s.total
                this.billsCount = s.count
                if (s.total > 0) {
                    this.pieChartLabels.push(category.name)
                    this.pieChartDataset.push(s.total)
                }
                return
            }

            if (category.groupId === CategoryGroupEnum.Spending) {
                this.spendingTotal += s.total
                this.spendingCategorySummaries.push(s)

                if (s.total > 0) {
                    this.pieChartLabels.push(category.name)
                    this.pieChartDataset.push(s.total)
                }
            } else {
                this.nonSpendingTotal += s.total
                this.nonSpendingCategorySummaries.push(s)
            }
        })

        this.barGraphLabels = this.dates.map((d) => this.getDateString(d))

        this.spendingCategoryTotalsByDate.forEach((t) => {
            const category = this.categories.find((c) => c.id === t.categoryId)
            if (!category) return
            if (category.id === CategoryEnum.Bills && !this.includeBills) return

            const data = this.dates.map(
                (date) => t.totalByDate.find((d) => d.date === date)?.total || 0
            )
            this.barGraphDatasets.push({
                label: category.name,
                data,
            })
        })

        this.updateCharts()
    }

    toggleIncludeBills(event: MouseEvent | KeyboardEvent): void {
        this.logger.info('toggling include bills', { event })

        if (!handleCheckboxSelect(event)) return
        this.loading = true
        const billsCategory = this.categories.find(
            (c) => c.id === CategoryEnum.Bills
        )
        if (!billsCategory) throw Error('could not find bills category')

        if (this.includeBills) {
            const billsLabelIdx = this.pieChartLabels.findIndex(
                (l) => l === billsCategory.name
            )
            if (billsLabelIdx !== -1) {
                this.pieChartLabels.splice(billsLabelIdx, 1)
                this.pieChartDataset.splice(billsLabelIdx, 1)
            }

            const billsDatasetIdx = this.barGraphDatasets.findIndex(
                (d) => d.label === billsCategory.name
            )
            if (billsDatasetIdx !== -1) {
                this.barGraphDatasets.splice(billsDatasetIdx, 1)
            }
        } else {
            const billsTotal = this.categorySummaries.find(
                (s) => s.categoryId === CategoryEnum.Bills
            )?.total
            if (billsTotal !== undefined && billsTotal > 0) {
                this.pieChartLabels.push(billsCategory.name)
                this.pieChartDataset.push(billsTotal)
            }

            const billsTotalByDate = this.spendingCategoryTotalsByDate.find(
                (t) => t.categoryId === CategoryEnum.Bills
            )?.totalByDate
            if (billsTotalByDate) {
                const data = this.dates.map(
                    (date) =>
                        billsTotalByDate.find((d) => d.date === date)?.total ||
                        0
                )
                this.barGraphDatasets.push({
                    label: billsCategory.name,
                    data,
                })
            }
        }
        this.includeBills = !this.includeBills

        this.updateCharts()
        this.loading = false
    }

    updateCharts(): void {
        this.charts.forEach((chart) => chart.chart?.update())
    }

    applyDateFilter(
        filter: DateFilterEnum,
        start: Date | null,
        end: Date | null
    ): void {
        if (filter !== DateFilterEnum.CUSTOM) {
            this.selectedDateFilter = filter
            redirectWithParams(this.router, this.route, { dateFilter: filter })
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
            redirectWithParams(
                this.router,
                this.route,
                { dateFilter: filter, startDate, endDate },
                false
            )
        }
    }

    resetDateFilter(): void {
        redirectWithParams(this.router, this.route, {}, false)
    }

    getCategoryName(categoryId: number): string {
        const category = this.categories.find((c) => c.id === categoryId)
        return category?.name ?? 'Unknown'
    }

    getSelectedDateRangeString(): string {
        if (this.selectedDateFilter !== DateFilterEnum.CUSTOM) {
            return dateFilterDescriptions[this.selectedDateFilter]
        }
        if (!this.startDate) {
            return `On or Before ${this.getDateString(this.endDate!)}`
        }
        if (!this.endDate) {
            return `On or After ${this.getDateString(this.startDate!)}`
        }
        return `${this.getDateString(this.startDate)} - ${this.getDateString(this.endDate)}`
    }

    getDateString(date: Date): string {
        return formatDate(date, true, false)
    }

    getIncomeTotalString(): string | undefined {
        return this.getAmountString(this.incomeTotal ?? 0)
    }

    getBillsTotalString(): string | undefined {
        return this.getAmountString(this.billsTotal ?? 0)
    }

    getSpendingTotalString(): string {
        return this.getAmountString(this.spendingTotal)
    }

    getNonSpendingTotalString(): string {
        return this.getAmountString(this.nonSpendingTotal)
    }

    getAmountString(total: number): string {
        const negative = total < 0
        const formatted = this.currencySvc.format(Math.abs(total), 'USD')
        if (negative) return `+${formatted}`
        return formatted
    }

    getRemainingAmountString(): string {
        return this.currencySvc.format(
            Math.abs(this.getRemainingAmount()),
            'USD'
        )
    }
    getRemainingAmount(): number {
        return (
            -1 *
            ((this.incomeTotal ?? 0) +
                (this.spendingTotal + (this.billsTotal ?? 0)))
        )
    }

    getPercentSpendingString(amount: number): string {
        const spendingBillsTotal =
            this.spendingTotal +
            (this.includeBills && this.billsTotal ? this.billsTotal : 0)
        return formatDecimalToPercent(amount / spendingBillsTotal)
    }

    getPercentNonSpendingString(amount: number): string {
        const nonSpendingBillsTotal =
            this.nonSpendingTotal +
            (!this.includeBills && this.billsTotal ? this.billsTotal : 0)
        return formatDecimalToPercent(amount / nonSpendingBillsTotal)
    }

    getPercentIncomeString(amount: number | undefined): string {
        if (this.incomeTotal === undefined || this.incomeTotal === 0) return '-'
        return formatDecimalToPercent((amount ?? 0) / (-1 * this.incomeTotal))
    }
}
