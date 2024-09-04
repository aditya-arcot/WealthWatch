import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit, QueryList, ViewChildren } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import {
    Category,
    CategoryEnum,
    CategoryGroupEnum,
} from '../../models/category'
import { DateFilterEnum } from '../../models/dateFilter'
import {
    CategoryTotalAndCount,
    CategoryTotalByDate,
} from '../../models/spending'
import { AlertService } from '../../services/alert.service'
import { CategoryService } from '../../services/category.service'
import { CurrencyService } from '../../services/currency.service'
import { LoggerService } from '../../services/logger.service'
import { SpendingService } from '../../services/spending.service'
import { checkDatesEqual } from '../../utilities/date.utility'

@Component({
    selector: 'app-spending',
    standalone: true,
    imports: [
        LoadingSpinnerComponent,
        FormsModule,
        BaseChartDirective,
        DateFilterComponent,
        CommonModule,
    ],
    templateUrl: './spending.component.html',
    styleUrl: './spending.component.css',
})
export class SpendingComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>

    loading = false

    selectedDateFilter: DateFilterEnum = DateFilterEnum.CURRENT_MONTH
    startDate: Date | null = null
    defaultStartDate: Date | null = null
    endDate: Date | null = null
    defaultEndDate: Date | null = null

    categories: Category[] = []
    totalAndCountByCategory: CategoryTotalAndCount[] = []
    dates: Date[] = []
    totalByCategoryAndDate: CategoryTotalByDate[] = []

    includeBills = true
    spendingTotal = -1
    spendingCategoriesTotalAndCount: CategoryTotalAndCount[] = []
    nonSpendingCategoriesTotalAndCount: CategoryTotalAndCount[] = []

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
                            return this.currencySvc.formatAmount(value, 'USD')
                        }
                        const parsed = parseFloat(value)
                        return this.currencySvc.formatAmount(parsed, 'USD')
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
                        return ' ' + this.currencySvc.formatAmount(val, 'USD')
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
        plugins: {
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => {
                        const val = tooltipItem.parsed
                        return ' ' + this.currencySvc.formatAmount(val, 'USD')
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
            },
        },
    }

    constructor(
        private logger: LoggerService,
        private categorySvc: CategoryService,
        private currencySvc: CurrencyService,
        private alertSvc: AlertService,
        private spendingSvc: SpendingService
    ) {}

    ngOnInit(): void {
        this.defaultStartDate = new Date()
        this.defaultStartDate.setHours(0, 0, 0, 0)
        this.defaultStartDate.setDate(1)
        this.startDate = new Date(this.defaultStartDate)
        this.loadData()
    }

    loadData(): void {
        this.loading = true
        this.loadCategories()
            .pipe(
                switchMap(() => this.loadTotalAndCountByCategory()),
                switchMap(() => this.loadTotalByCategoryAndDate()),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to load data', [
                        err.message,
                    ])
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.processData()
                this.loading = false
            })
    }

    loadCategories(): Observable<void> {
        return this.categorySvc.getCategories().pipe(
            switchMap((c) => {
                this.logger.debug('loaded categories', c)
                this.categories = c
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load categories', err)
                return throwError(() => err)
            })
        )
    }

    loadTotalAndCountByCategory(): Observable<void> {
        return this.spendingSvc
            .getTotalAndCountByCategory(this.startDate, this.endDate)
            .pipe(
                switchMap((t) => {
                    this.logger.debug('loaded total and count by category', t)
                    this.totalAndCountByCategory = t
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error(
                        'failed to load total and count by category',
                        err
                    )
                    return throwError(() => err)
                })
            )
    }

    loadTotalByCategoryAndDate(): Observable<void> {
        return this.spendingSvc
            .getTotalByCategoryAndDate(this.startDate, this.endDate)
            .pipe(
                switchMap((t) => {
                    this.logger.debug('loaded total by category and date', t)
                    this.dates = t.dates
                    this.totalByCategoryAndDate = t.totals
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error(
                        'failed to load total by category and date',
                        err
                    )
                    return throwError(() => err)
                })
            )
    }

    processData(): void {
        this.spendingTotal = 0
        this.spendingCategoriesTotalAndCount = []
        this.nonSpendingCategoriesTotalAndCount = []

        this.pieChartLabels = []
        this.pieChartDataset = []

        this.barGraphLabels = []
        this.barGraphDatasets = []

        this.totalAndCountByCategory.forEach((t) => {
            const category = this.categories.find((c) => c.id === t.categoryId)
            if (!category) return

            if (
                category.groupId === CategoryGroupEnum.Spending &&
                (category.id !== CategoryEnum.Bills || this.includeBills)
            ) {
                this.spendingTotal += t.total
                this.spendingCategoriesTotalAndCount.push(t)

                if (t.total > 0) {
                    this.pieChartLabels.push(category.name)
                    this.pieChartDataset.push(t.total)
                }
            } else {
                if (category.id === CategoryEnum.Bills) {
                    this.nonSpendingCategoriesTotalAndCount.unshift(t)
                } else {
                    this.nonSpendingCategoriesTotalAndCount.push(t)
                }
            }
        })

        this.barGraphLabels = this.dates.map((d) => this.getFormattedDate(d))

        this.totalByCategoryAndDate.forEach((t) => {
            const category = this.categories.find((c) => c.id === t.categoryId)
            if (!category) return
            if (category.groupId !== CategoryGroupEnum.Spending) return
            if (category.id === CategoryEnum.Bills && !this.includeBills) return

            this.barGraphDatasets.push({
                label: category.name,
                data: t.totalByDate,
            })
        })

        this.updateCharts()
    }

    toggleIncludeBills(): void {
        this.loading = true
        const billsCategory = this.categories.find(
            (c) => c.id === CategoryEnum.Bills
        )

        if (this.includeBills) {
            const billsIdx = this.spendingCategoriesTotalAndCount.findIndex(
                (t) => t.categoryId === CategoryEnum.Bills
            )
            if (billsIdx !== -1) {
                const bills = this.spendingCategoriesTotalAndCount.splice(
                    billsIdx,
                    1
                )[0]
                this.nonSpendingCategoriesTotalAndCount.unshift(bills)
                this.spendingTotal -= bills.total
            }

            if (billsCategory) {
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
            }
        } else {
            const billsIdx = this.nonSpendingCategoriesTotalAndCount.findIndex(
                (t) => t.categoryId === CategoryEnum.Bills
            )
            if (billsIdx !== -1) {
                const bills = this.nonSpendingCategoriesTotalAndCount.splice(
                    billsIdx,
                    1
                )[0]
                this.spendingCategoriesTotalAndCount.push(bills)
                this.spendingTotal += bills.total
            }

            if (billsCategory) {
                const billsTotal = this.totalAndCountByCategory.find(
                    (t) => t.categoryId === CategoryEnum.Bills
                )?.total
                if (billsTotal !== undefined && billsTotal > 0) {
                    this.pieChartLabels.push(billsCategory.name)
                    this.pieChartDataset.push(billsTotal)
                }

                const billsTotalByDate = this.totalByCategoryAndDate.find(
                    (t) => t.categoryId === CategoryEnum.Bills
                )?.totalByDate
                if (billsTotalByDate) {
                    this.barGraphDatasets.push({
                        label: billsCategory.name,
                        data: billsTotalByDate,
                    })
                }
            }
        }

        this.updateCharts()
        this.includeBills = !this.includeBills
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
        this.selectedDateFilter = filter
        let reload = false
        if (start !== this.startDate) {
            this.startDate = start ? new Date(start) : null
            reload = true
        }
        if (end !== this.endDate) {
            this.endDate = end ? new Date(end) : null
            reload = true
        }
        if (reload) {
            this.loadData()
        }
    }

    resetDateFilter(): void {
        this.selectedDateFilter = DateFilterEnum.CURRENT_MONTH
        let reload = false
        if (!checkDatesEqual(this.startDate, this.defaultStartDate)) {
            this.startDate = this.defaultStartDate
                ? new Date(this.defaultStartDate)
                : null
            reload = true
        }
        if (!checkDatesEqual(this.endDate, this.defaultEndDate)) {
            this.endDate = this.defaultEndDate
                ? new Date(this.defaultEndDate)
                : null
            reload = true
        }
        if (reload) {
            this.loadData()
        }
    }

    getCategoryName(categoryId: number): string {
        const category = this.categories.find((c) => c.id === categoryId)
        return category?.name ?? 'Unknown'
    }

    getFormattedSelectedDateRange(): string {
        if (this.selectedDateFilter !== DateFilterEnum.CUSTOM) {
            return this.selectedDateFilter
        }
        if (!this.startDate) {
            return `On or Before ${this.getFormattedDate(this.endDate!)}`
        }
        if (!this.endDate) {
            return `On or After ${this.getFormattedDate(this.startDate!)}`
        }
        return `${this.getFormattedDate(this.startDate)} - ${this.getFormattedDate(this.endDate)}`
    }

    getFormattedDate(date: Date): string {
        return new Date(date).toLocaleDateString(undefined, {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
        })
    }

    getFormattedTotal(total: number): string {
        const negative = total < 0
        const formatted = this.currencySvc.formatAmount(Math.abs(total), 'USD')
        if (negative) return `+${formatted}`
        return formatted
    }

    getFormattedTotalPercent(total: number): string {
        return `${((total / this.spendingTotal) * 100).toFixed(1)}%`
    }
}
