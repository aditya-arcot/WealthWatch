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
}
