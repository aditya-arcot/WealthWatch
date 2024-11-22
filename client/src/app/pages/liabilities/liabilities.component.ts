import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import {
    catchError,
    finalize,
    Observable,
    of,
    switchMap,
    throwError,
} from 'rxjs'
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component'
import {
    Account,
    CreditCardAccount,
    MortgageAccount,
    StudentLoanAccount,
} from '../../models/account'
import {
    ItemWithCreditCardAccounts,
    ItemWithMortgageAccounts,
    ItemWithStudentLoanAccounts,
} from '../../models/item'
import {
    studentLoanRepaymentPlanNames,
    studentLoanStatusNames,
} from '../../models/liability'
import { AlertService } from '../../services/alert.service'
import { CurrencyService } from '../../services/currency.service'
import { ItemService } from '../../services/item.service'
import { LoggerService } from '../../services/logger.service'
import { formatDate } from '../../utilities/date.utility'
import { formatPercent } from '../../utilities/number.utility'
import { capitalize } from '../../utilities/string.utility'

@Component({
    standalone: true,
    imports: [LoadingSpinnerComponent],
    templateUrl: './liabilities.component.html',
    styleUrl: './liabilities.component.css',
})
export class LiabilitiesComponent implements OnInit {
    loading = false
    creditCardItems: ItemWithCreditCardAccounts[] = []
    mortgageItems: ItemWithMortgageAccounts[] = []
    studentLoanItems: ItemWithStudentLoanAccounts[] = []

    constructor(
        private logger: LoggerService,
        private alertSvc: AlertService,
        private itemSvc: ItemService,
        private currencySvc: CurrencyService
    ) {}

    ngOnInit(): void {
        this.loadData()
    }

    loadData(): void {
        this.loading = true
        this.loadItemsWithCreditCardAccounts()
            .pipe(
                switchMap(() => this.loadItemsWithMortgageAccounts()),
                switchMap(() => this.loadItemsWithStudentLoanAccounts()),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to load data', [
                        err.message,
                    ])
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe()
    }

    loadItemsWithCreditCardAccounts(): Observable<void> {
        return this.itemSvc.getItemsWithCreditCardAccounts().pipe(
            switchMap((items) => {
                this.logger.debug(
                    'loaded items with credit card accounts',
                    items
                )
                this.creditCardItems = items
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error(
                    'failed to load items with credit card accounts',
                    err
                )
                return throwError(() => err)
            })
        )
    }

    loadItemsWithMortgageAccounts(): Observable<void> {
        return this.itemSvc.getItemsWithMortgageAccounts().pipe(
            switchMap((items) => {
                this.logger.debug('loaded items with mortgage accounts', items)
                this.mortgageItems = items
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error(
                    'failed to load items with mortgage accounts',
                    err
                )
                return throwError(() => err)
            })
        )
    }

    loadItemsWithStudentLoanAccounts(): Observable<void> {
        return this.itemSvc.getItemsWithStudentLoanAccounts().pipe(
            switchMap((items) => {
                this.logger.debug(
                    'loaded items with student loan accounts',
                    items
                )
                this.studentLoanItems = items
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error(
                    'failed to load items with student loan accounts',
                    err
                )
                return throwError(() => err)
            })
        )
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
        return studentLoanStatusNames[acc.statusTypeId]
    }

    getStudentLoanRepaymentPlanName(acc: StudentLoanAccount): string {
        if (!acc.repaymentPlanTypeId) {
            return ''
        }
        return studentLoanRepaymentPlanNames[acc.repaymentPlanTypeId]
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
        return formatDate(date, false)
    }
}
