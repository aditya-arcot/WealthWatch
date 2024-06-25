import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { catchError, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { TransactionService } from '../../services/transaction.service'

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    constructor(
        private transactionSvc: TransactionService,
        private alertSvc: AlertService
    ) {}

    ngOnInit(): void {
        this.transactionSvc
            .getTransactions()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert('Failed to get transactions')
                    return throwError(() => err)
                })
            )
            .subscribe()
    }
}
