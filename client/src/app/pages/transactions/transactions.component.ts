import { DatePipe, DecimalPipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { Transaction } from '../../models/transaction'
import { LoggerService } from '../../services/logger.service'
import { TransactionService } from '../../services/transaction.service'

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [DecimalPipe, DatePipe],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    transactions: Transaction[] = []
    currencyFormatters: Record<string, Intl.NumberFormat> = {
        USD: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }),
    }

    constructor(
        private transactionSvc: TransactionService,
        private logger: LoggerService
    ) {}

    ngOnInit(): void {
        this.loadTransactions()
    }

    loadTransactions(): void {
        this.transactionSvc.getTransactions().subscribe((t) => {
            this.logger.debug('loaded transactions', t)
            this.transactions = t
        })
    }

    formatCurrency(t: Transaction): string {
        const currency = t.unofficialCurrencyCode ?? t.isoCurrencyCode
        if (!currency) return t.amount.toString()

        if (!this.currencyFormatters[currency]) {
            this.currencyFormatters[currency] = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            })
        }

        return this.currencyFormatters[currency].format(t.amount)
    }

    formatCategory(t: Transaction): string {
        if (!t.category) return ''
        return t.category
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .replace(/\b(And|Or)\b/g, (c) => c.toLowerCase())
    }
}
