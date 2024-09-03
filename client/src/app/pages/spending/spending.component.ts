import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { DateFilterComponent } from '../../components/filters/date-filter/date-filter.component'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Category, CategoryGroupEnum } from '../../models/category'
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
                },
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Amount',
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
        this.spendingCategoriesTotalAndCount = []
        this.nonSpendingCategoriesTotalAndCount = []

        this.pieChartLabels = []
        this.pieChartDataset = []

        this.barGraphLabels = []
        this.barGraphDatasets = []

        this.totalAndCountByCategory.forEach((t) => {
            const category = this.categories.find((c) => c.id === t.categoryId)
            if (!category) return

            if (category.groupId === CategoryGroupEnum.Spending) {
                this.spendingCategoriesTotalAndCount.push(t)

                if (t.total > 0) {
                    this.pieChartLabels.push(category.name)
                    this.pieChartDataset.push(t.total)
                }
            } else {
                this.nonSpendingCategoriesTotalAndCount.push(t)
            }
        })

        this.barGraphLabels = this.dates.map((d) => this.getFormattedDate(d))

        this.totalByCategoryAndDate.forEach((t) => {
            const category = this.categories.find((c) => c.id === t.categoryId)
            if (!category) return
            if (category.groupId !== CategoryGroupEnum.Spending) return

            this.barGraphDatasets.push({
                label: category.name,
                data: t.totalByDate,
            })
        })
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
}
