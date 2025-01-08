import { CommonModule } from '@angular/common'
import {
    Component,
    Injector,
    OnInit,
    QueryList,
    ViewChildren,
} from '@angular/core'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, finalize, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../../components/logger.component'
import { AccountWithHoldings } from '../../models/account'
import { HoldingWithSecurity } from '../../models/holding'
import { ItemWithAccountsWithHoldings } from '../../models/item'
import { SecurityTypeEnum } from '../../models/security'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { InvestmentService } from '../../services/investment.service'
import { ItemService } from '../../services/item.service'
import { handleCheckboxSelect } from '../../utilities/checkbox.utility'
import { formatDecimalToPercent } from '../../utilities/number.utility'

@Component({
    imports: [LoadingSpinnerComponent, CommonModule, BaseChartDirective],
    templateUrl: './investments.component.html',
    styleUrl: './investments.component.css',
})
export class InvestmentsComponent extends LoggerComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>

    loading = false

    items: ItemWithAccountsWithHoldings[] = []
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

    constructor(
        private alertSvc: AlertService,
        private itemSvc: ItemService,
        private investmentSvc: InvestmentService,
        private currencySvc: CurrencyService,
        injector: Injector
    ) {
        super(injector, 'InvestmentsComponent')
    }

    ngOnInit(): void {
        this.loadHoldings()
    }

    loadHoldings(): void {
        this.logger.info('loading holdings')
        this.loading = true
        this.itemSvc
            .getItemsWithAccountsWithHoldings()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to load holdings. Please try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((items) => {
                this.items = items
                this.processData()
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
                a.holdings.forEach((h) => {
                    this.addHoldingToPieChart(i, a, h)
                })
            })
        })

        this.updateCharts()
    }

    refreshInvestments(): void {
        this.logger.info('refreshing investments')
        this.loading = true
        this.investmentSvc
            .refreshInvestments()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to refresh investments. Please try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.alertSvc.addSuccessAlert(
                    this.logger,
                    'Refreshing investments',
                    'Please check back later'
                )
            })
    }

    updateCharts(): void {
        this.charts.forEach((chart) => chart.chart?.update())
    }

    addAccountToPieChart(accountId: number): void {
        this.selectedAccountIds.add(accountId)
        this.items.forEach((i) => {
            i.accounts.forEach((a) => {
                if (a.id === accountId) {
                    a.holdings.forEach((h) => {
                        this.addHoldingToPieChart(i, a, h)
                    })
                }
            })
        })
    }

    addHoldingToPieChart(
        i: ItemWithAccountsWithHoldings,
        a: AccountWithHoldings,
        h: HoldingWithSecurity
    ): void {
        const name = h.ticker ?? h.name ?? 'Unknown'
        const account = `${i.institutionName} ${a.name}`
        this.pieChartLabels.push(`${name} (${account})`)
        this.pieChartLabelAccountIds.push(a.id)
        this.pieChartDataset.push(h.value)
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
        return `${this.selectedAccountIds.size} Selected`
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

    getGainLossClass(holding: HoldingWithSecurity): string {
        const gainLoss = this.getGainLoss(holding)
        if (gainLoss === null) return ''
        return gainLoss >= 0 ? 'text-success' : 'text-danger'
    }

    getTotalGainLossClass(account: AccountWithHoldings): string {
        const gainLoss = this.getTotalGainLoss(account)
        return gainLoss >= 0 ? 'text-success' : 'text-danger'
    }

    getGainLoss(holding: HoldingWithSecurity): number | null {
        if (holding.costBasis === null) return null
        return holding.value - holding.costBasis
    }

    getTotalGainLoss(account: AccountWithHoldings): number {
        return account.holdings.reduce(
            (acc, h) => acc + (this.getGainLoss(h) ?? 0),
            0
        )
    }

    getTotalCostBasis(account: AccountWithHoldings): number {
        return account.holdings.reduce((acc, h) => acc + (h.costBasis ?? 0), 0)
    }

    getNameString(holding: HoldingWithSecurity): string {
        if (holding.name === null) {
            return 'Unknown'
        }
        return holding.name
    }

    getTypeString(holding: HoldingWithSecurity): string {
        return SecurityTypeEnum[holding.typeId]
    }

    getPriceString(holding: HoldingWithSecurity): string {
        return this.currencySvc.format(
            holding.price,
            holding.unofficialCurrencyCode ?? holding.isoCurrencyCode
        )
    }

    getQuantityString(holding: HoldingWithSecurity): string {
        return holding.quantity.toLocaleString()
    }

    getGainLossString(holding: HoldingWithSecurity): string {
        const gainLoss = this.getGainLoss(holding)
        if (gainLoss === null) return '-'
        const formatted = this.currencySvc.format(
            gainLoss,
            holding.unofficialCurrencyCode ?? holding.isoCurrencyCode
        )
        if (gainLoss > 0) return `+${formatted}`
        return formatted
    }

    getGainLossPercentString(holding: HoldingWithSecurity): string {
        const gainLoss = this.getGainLoss(holding)
        if (gainLoss === null) return ''
        if (holding.costBasis === null) return ''
        const ratio = gainLoss / holding.costBasis
        const formatted = formatDecimalToPercent(ratio)
        if (ratio > 0) return `+${formatted}`
        return formatted
    }

    getValueString(holding: HoldingWithSecurity): string {
        return this.currencySvc.format(
            holding.value,
            holding.unofficialCurrencyCode ?? holding.isoCurrencyCode
        )
    }

    getCostBasisString(holding: HoldingWithSecurity): string {
        return this.currencySvc.format(
            holding.costBasis,
            holding.unofficialCurrencyCode ?? holding.isoCurrencyCode
        )
    }

    getCostBasisPerShareString(holding: HoldingWithSecurity): string {
        if (holding.costBasis === null) return ''
        const costBasisPerShare = holding.costBasis / holding.quantity
        const formatted = this.currencySvc.format(
            costBasisPerShare,
            holding.unofficialCurrencyCode ?? holding.isoCurrencyCode
        )
        return `${formatted} ea.`
    }

    getTotalGainLossString(account: AccountWithHoldings): string {
        const gainLoss = this.getTotalGainLoss(account)
        const formatted = this.currencySvc.format(
            gainLoss,
            account.unofficialCurrencyCode ?? account.isoCurrencyCode
        )
        if (gainLoss > 0) return `+${formatted}`
        return formatted
    }

    getTotalGainLossPercentString(account: AccountWithHoldings): string {
        const gainLoss = this.getTotalGainLoss(account)
        const costBasis = this.getTotalCostBasis(account)
        const ratio = gainLoss / costBasis
        const formatted = formatDecimalToPercent(ratio)
        if (ratio > 0) return `+${formatted}`
        return formatted
    }

    getTotalValueString(account: AccountWithHoldings): string {
        const total = account.holdings.reduce((acc, h) => acc + h.value, 0)
        return this.currencySvc.format(
            total,
            account.unofficialCurrencyCode ?? account.isoCurrencyCode
        )
    }

    getTotalCostBasisString(account: AccountWithHoldings): string {
        return this.currencySvc.format(
            this.getTotalCostBasis(account),
            account.unofficialCurrencyCode ?? account.isoCurrencyCode
        )
    }
}
