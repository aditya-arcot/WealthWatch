import { Component, OnInit } from '@angular/core'
import { tap } from 'rxjs'
import { TransactionService } from '../../services/transaction.service'

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    constructor(private transactionSvc: TransactionService) {}

    ngOnInit(): void {
        this.transactionSvc
            .getTransactions()
            .pipe(tap((transactions) => console.log(transactions)))
            .subscribe()
    }
}
