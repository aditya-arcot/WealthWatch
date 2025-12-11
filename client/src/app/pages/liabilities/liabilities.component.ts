import { HttpErrorResponse } from '@angular/common/http'
import {
    Component,
    OnInit,
    QueryList,
    ViewChildren,
    inject,
} from '@angular/core'
import { LoadingSpinnerComponent } from '@components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '@components/logger.component'
import {
    studentLoanRepaymentPlanTypeNameMap,
    studentLoanStatusTypeNameMap,
} from '@maps/liability'
import { AlertService } from '@services/alert.service'
import { CurrencyService } from '@services/currency.service'
import { ItemService } from '@services/item.service'
import { handleCheckboxSelect } from '@utilities/checkbox.utility'
import { formatDate } from '@utilities/date.utility'
import { formatPercent } from '@utilities/number.utility'
import { capitalize } from '@utilities/string.utility'
import {
    Account,
    CreditCardAccount,
    ItemWithAccountsWithLiabilities,
    ItemWithCreditCardAccounts,
    ItemWithMortgageAccounts,
    ItemWithStudentLoanAccounts,
    MortgageAccount,
    StudentLoanAccount,
} from '@wealthwatch-shared'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, finalize, switchMap, tap, throwError } from 'rxjs'

@Component({
    imports: [LoadingSpinnerComponent, BaseChartDirective],
    templateUrl: './liabilities.component.html',
    styleUrl: './liabilities.component.css',
})
export class LiabilitiesComponent extends LoggerComponent implements OnInit {
    private alertSvc = inject(AlertService)
    private itemSvc = inject(ItemService)
    private currencySvc = inject(CurrencyService)

    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>

    loading = false

    items: ItemWithAccountsWithLiabilities[] = []
    creditCardItems: ItemWithCreditCardAccounts[] = []
    mortgageItems: ItemWithMortgageAccounts[] = []
    studentLoanItems: ItemWithStudentLoanAccounts[] = []
    selectedAccountIds: Set<number> = new Set<number>()

    pieChartLabels: string[] = []
    pieChartLabelAccountIds: number[] = []
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
                display: false,
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

    constructor() {
        super('LiabilitiesComponent')
    }

    ngOnInit(): void {
        this.loadLiabilities()
    }

    loadLiabilities(): void {
        this.logger.info('loading liabilities')
        this.loading = true
        this.loadItemsWithCreditCardAccounts()
            .pipe(
                switchMap(() => this.loadItemsWithMortgageAccounts()),
                switchMap(() => this.loadItemsWithStudentLoanAccounts()),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to load liabilities'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.processData()
            })
    }

    loadItemsWithCreditCardAccounts() {
        this.logger.info('loading credit cards')
        return this.itemSvc.getItemsWithCreditCardAccounts().pipe(
            tap((items) => {
                this.creditCardItems = items
                this.mergeItems(items)
            })
        )
    }

    loadItemsWithMortgageAccounts() {
        this.logger.info('loading mortgages')
        return this.itemSvc.getItemsWithMortgageAccounts().pipe(
            tap((items) => {
                this.mortgageItems = items
                this.mergeItems(items)
            })
        )
    }

    loadItemsWithStudentLoanAccounts() {
        this.logger.info('loading student loans')
        return this.itemSvc.getItemsWithStudentLoanAccounts().pipe(
            tap((items) => {
                this.studentLoanItems = items
                this.mergeItems(items)
            })
        )
    }

    mergeItems(newItems: ItemWithAccountsWithLiabilities[]) {
        this.logger.info('merging items', { newItems })
        newItems.forEach((i) => {
            const item = this.items.find((item) => item.id === i.id)
            if (item) {
                item.accounts.push(...i.accounts)
            } else {
                this.items.push(structuredClone(i))
            }
        })
    }

    processData(): void {
        this.logger.info('processing data')
        this.selectedAccountIds = new Set<number>(
            this.items
                .map((i) => i.accounts)
                .flat()
                .map((a) => a.id)
        )

        this.pieChartLabels = []
        this.pieChartLabelAccountIds = []
        this.pieChartDataset = []

        this.items.forEach((i) => {
            i.accounts.forEach((a) => {
                this.addAccountToPieChart(a.id)
            })
        })

        this.updateCharts()
    }

    updateCharts(): void {
        this.charts.forEach((chart) => chart.chart?.update())
    }

    addAccountToPieChart(accountId: number): void {
        this.selectedAccountIds.add(accountId)
        this.items.forEach((i) => {
            i.accounts.forEach((a) => {
                if (a.id === accountId) {
                    this.pieChartLabels.push(a.name)
                    this.pieChartLabelAccountIds.push(a.id)
                    this.pieChartDataset.push(a.currentBalance ?? 0)
                }
            })
        })
    }

    removeAccountFromPieChart(accountId: number): void {
        this.selectedAccountIds.delete(accountId)

        const newLabels: string[] = []
        const newLabelsAccountIds: number[] = []
        const newData: number[] = []

        this.pieChartLabelAccountIds.forEach((id, idx) => {
            if (id !== accountId) {
                newLabels.push(this.pieChartLabels[idx])
                newLabelsAccountIds.push(id)
                newData.push(this.pieChartDataset[idx])
            }
        })

        this.pieChartLabels = newLabels
        this.pieChartLabelAccountIds = newLabelsAccountIds
        this.pieChartDataset = newData
    }

    getSelectAccountsString(): string {
        if (this.selectedAccountIds.size === 0) {
            return 'Select Accounts'
        }
        const accounts = this.items.map((i) => i.accounts).flat().length
        if (this.selectedAccountIds.size === accounts) {
            return 'All Accounts Selected'
        }
        return `${String(this.selectedAccountIds.size)} Selected`
    }

    accountSelected(id: number) {
        return this.selectedAccountIds.has(id)
    }

    handleAccountSelect(event: MouseEvent | KeyboardEvent, accountId: number) {
        if (!handleCheckboxSelect(event)) return
        const checkbox = event.target as HTMLInputElement
        if (checkbox.checked) {
            this.addAccountToPieChart(accountId)
        } else {
            this.removeAccountFromPieChart(accountId)
        }
        this.updateCharts()
    }

    invertAccountsSelection() {
        this.items
            .map((i) => i.accounts)
            .flat()
            .forEach((a) => {
                if (!this.selectedAccountIds.has(a.id)) {
                    this.addAccountToPieChart(a.id)
                } else {
                    this.removeAccountFromPieChart(a.id)
                }
            })
    }

    getCurrentBalanceString(acc: Account): string {
        return this.getCurrencyString(
            acc.currentBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getCreditLimitString(acc: Account): string {
        return this.getCurrencyString(
            acc.creditLimit,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getLastPaymentAmountString(
        acc: CreditCardAccount | StudentLoanAccount | MortgageAccount
    ): string {
        return this.getCurrencyString(
            acc.lastPaymentAmount,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getLastPaymentDateString(
        acc: CreditCardAccount | StudentLoanAccount | MortgageAccount
    ): string {
        return this.getDateString(acc.lastPaymentDate)
    }

    getLastStatementBalanceString(
        acc: CreditCardAccount | StudentLoanAccount
    ): string {
        return this.getCurrencyString(
            acc.lastStatementBalance,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getLastStatementDateString(
        acc: CreditCardAccount | StudentLoanAccount
    ): string {
        return this.getDateString(acc.lastStatementDate)
    }

    getMinimumPaymentAmountString(
        acc: CreditCardAccount | StudentLoanAccount
    ): string {
        return this.getCurrencyString(
            acc.minimumPaymentAmount,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getNextPaymentDateString(
        acc: CreditCardAccount | StudentLoanAccount | MortgageAccount
    ): string {
        return `Due ${this.getDateString(acc.nextPaymentDueDate)}`
    }

    getInterestRatePercentString(
        acc: StudentLoanAccount | MortgageAccount
    ): string {
        return formatPercent(acc.interestRatePercent, 2)
    }

    getStudentLoanStatusName(acc: StudentLoanAccount): string {
        if (!acc.statusTypeId) {
            return ''
        }
        return studentLoanStatusTypeNameMap[acc.statusTypeId]
    }

    getStudentLoanRepaymentPlanName(acc: StudentLoanAccount): string {
        if (!acc.repaymentPlanTypeId) {
            return ''
        }
        return studentLoanRepaymentPlanTypeNameMap[acc.repaymentPlanTypeId]
    }

    getStudentLoanStatusEndDate(acc: StudentLoanAccount): string {
        return this.getDateString(acc.statusEndDate)
    }

    getStudentLoanPayoffDateString(acc: StudentLoanAccount): string {
        return this.getDateString(acc.expectedPayoffDate)
    }

    getMortgageInterestRateDetail(acc: MortgageAccount): string | undefined {
        const detail = []
        if (acc.term) {
            detail.push(acc.term)
        }
        if (acc.interestRateType) {
            detail.push(acc.interestRateType)
        }
        return capitalize(detail.join(' '))
    }

    getMortgageMaturityDateString(acc: MortgageAccount): string {
        return this.getDateString(acc.maturityDate)
    }

    getMortgagePastDueString(acc: MortgageAccount): string {
        return this.getCurrencyString(
            acc.pastDueAmount,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getMortgageNextPaymentAmountString(acc: MortgageAccount): string {
        return this.getCurrencyString(
            acc.nextPaymentAmount,
            acc.unofficialCurrencyCode ?? acc.isoCurrencyCode
        )
    }

    getCurrencyString(
        amount: number | null,
        currencyCode: string | null
    ): string {
        return this.currencySvc.format(amount, currencyCode)
    }

    getDateString(date: Date | null): string {
        return formatDate(date, true, false)
    }
}
