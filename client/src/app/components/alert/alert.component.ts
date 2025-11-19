import { CommonModule } from '@angular/common'
import { Component, OnDestroy, inject } from '@angular/core'
import { AlertTypeEnum } from '@enums/alert'
import { Alert } from '@models/alert'
import { AlertService } from '@services/alert.service'
import { Subscription } from 'rxjs'

@Component({
    selector: 'app-alert',
    imports: [CommonModule],
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.css',
})
export class AlertComponent implements OnDestroy {
    private alertSvc = inject(AlertService)

    alerts: Alert[] = []
    subscription: Subscription

    constructor() {
        this.subscription = this.alertSvc
            .getAlerts()
            .subscribe((n) => (this.alerts = n))
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe()
    }

    removeAlert(id: string): void {
        this.alertSvc.removeAlert(id)
    }

    getAlertClass(type: AlertTypeEnum): string {
        switch (type) {
            case AlertTypeEnum.Success:
                return 'alert-success'
            case AlertTypeEnum.Error:
                return 'alert-danger'
        }
    }

    getAlertIconClass(type: AlertTypeEnum): string {
        switch (type) {
            case AlertTypeEnum.Success:
                return 'bi-check-circle-fill'
            case AlertTypeEnum.Error:
                return 'bi-exclamation-triangle-fill'
        }
    }
}
