import { CommonModule } from '@angular/common'
import { Component, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { AlertTypeEnum } from '../../enums/alert'
import { Alert } from '../../models/alert'
import { AlertService } from '../../services/alert.service'

@Component({
    selector: 'app-alert',
    imports: [CommonModule],
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.css',
})
export class AlertComponent implements OnDestroy {
    alerts: Alert[] = []
    subscription: Subscription

    constructor(private alertSvc: AlertService) {
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
