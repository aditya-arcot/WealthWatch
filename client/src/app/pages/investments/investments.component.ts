import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit, QueryList, ViewChildren } from '@angular/core'
import { ChartOptions } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import { Account, AccountWithHoldings } from '../../models/account'
import { HoldingWithSecurity } from '../../models/holding'
import { ItemWithAccountsWithHoldings } from '../../models/item'
import { SecurityTypeEnum } from '../../models/security'
import { AccountService } from '../../services/account.service'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { InvestmentService } from '../../services/investment.service'
import { ItemService } from '../../services/item.service'
import { LoggerService } from '../../services/logger.service'
import { PercentService } from '../../services/percent.service'
import { handleCheckboxSelect } from '../../utilities/checkbox.utility'

@Component({
    standalone: true,
    imports: [LoadingSpinnerComponent, CommonModule, BaseChartDirective],
    templateUrl: './investments.component.html',
    styleUrl: './investments.component.css',
})
export class InvestmentsComponent implements OnInit {
    @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>

    loading = false

    unfilteredItems: ItemWithAccountsWithHoldings[] = []
    items: ItemWithAccountsWithHoldings[] = []
    accounts: Account[] = []
    holdings: HoldingWithSecurity[] = []

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
        private logger: LoggerService,
        private alertSvc: AlertService,
        private itemSvc: ItemService,
        private accountSvc: AccountService,
        private investmentSvc: InvestmentService,
        private currencySvc: CurrencyService,
        private percentSvc: PercentService
    ) {}

    ngOnInit(): void {
        this.loadData()
    }

    loadData(): void {
        this.loading = true
        this.loadItems()
            .pipe(
                switchMap(() => this.loadAccounts()),
                switchMap(() => this.loadHoldings()),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error('failed to load data', err.message)
                    this.loading = false
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.mapData()
                this.processData()
                this.loading = false
            })
    }

    loadItems(): Observable<void> {
        return this.itemSvc.getItems().pipe(
            switchMap((i) => {
                this.logger.debug('loaded items', i)
                this.unfilteredItems = i.map((item) => {
                    return { ...item, accounts: [] }
                })
                this.items = []
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load items', err)
                return throwError(() => err)
            })
        )
    }

    loadAccounts(): Observable<void> {
        return this.accountSvc.getAccounts().pipe(
            switchMap((a) => {
                this.logger.debug('loaded accounts', a)
                this.accounts = a
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load accounts', err)
                return throwError(() => err)
            })
        )
    }

    loadHoldings(): Observable<void> {
        return this.investmentSvc.getHoldings().pipe(
            switchMap((h) => {
                this.logger.debug('loaded holdings', h)
                this.holdings = h
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load holdings', err)
                return throwError(() => err)
            })
        )
    }

    mapData(): void {
        this.holdings.forEach((h) => {
            const account = this.accounts.find((a) => a.id === h.accountId)
            if (!account) {
                this.alertSvc.addErrorAlert(
                    'Something went wrong. Please report this issue.',
                    [
                        `Failed to find account ${h.accountId} for holding ${h.id}`,
                    ]
                )
                return
            }

            const item = this.unfilteredItems.find(
                (i) => i.id === account?.itemId
            )
            if (!item) {
                this.alertSvc.addErrorAlert(
                    'Something went wrong. Please report this issue.',
                    [
                        `Failed to find item with id ${account?.itemId} for account ${account?.id}`,
                    ]
                )
                return
            }

            const existingAccount = item.accounts.find(
                (a) => a.id === account.id
            )
            if (existingAccount) {
                existingAccount.holdings.push(h)
                return
            }

            const newAccount = { ...account, holdings: [h] }
            item.accounts.push(newAccount)
        })

        this.items = this.unfilteredItems.filter((i) => i.accounts.length > 0)

        this.selectedAccountIds = new Set<number>(
            this.items
                .map((i) => i.accounts)
                .flat()
                .map((a) => a.id)
        )

        this.logger.debug('mapped data', this.items)
    }

    processData(): void {
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
        this.logger.debug('processed data for pie chart')
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
        const total = account.holdings.reduce(
            (acc, h) => acc + (this.getGainLoss(h) ?? 0),
            0
        )
        return total
    }

    getTotalCostBasis(account: AccountWithHoldings): number {
        const total = account.holdings.reduce(
            (acc, h) => acc + (h.costBasis ?? 0),
            0
        )
        return total
    }

    getTickerString(holding: HoldingWithSecurity): string | null {
        if (holding.ticker === null) {
            return ''
        }
        return ` (${holding.ticker})`
    }

    getNameString(holding: HoldingWithSecurity): string {
        if (holding.name === null) {
            return 'Unknown'
        }
        return holding.name
    }

    getNameTypeString(holding: HoldingWithSecurity): string {
        const type = SecurityTypeEnum[holding.typeId]
        if (holding.name === null) {
            return type
        }
        return `${holding.name} | ${type}`
    }

    getTypeString(typeId: number): string {
        return SecurityTypeEnum[typeId]
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
        const percent = gainLoss / holding.costBasis
        const formatted = this.percentSvc.format(percent)
        if (percent > 0) return `+${formatted}`
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
        return `${formatted} / share`
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
        const percent = gainLoss / costBasis
        const formatted = this.percentSvc.format(percent)
        if (percent > 0) return `+${formatted}`
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
