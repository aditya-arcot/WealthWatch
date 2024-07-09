import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { v4 as uuid } from 'uuid'
import { Alert, AlertType } from '../models/alert'
import { LoggerService } from './logger.service'

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    private alerts: Alert[] = []
    private alertSubject = new BehaviorSubject<Alert[]>([])

    constructor(private logger: LoggerService) {}

    getAlerts(): Observable<Alert[]> {
        return this.alertSubject.asObservable()
    }

    addSuccessAlert(message: string, subtext?: string[]): void {
        this.addAlert(AlertType.Success, message, subtext)
        if (subtext) {
            this.logger.info(message, subtext)
        } else {
            this.logger.info(message)
        }
    }

    addErrorAlert(message: string, subtext?: string[]): void {
        this.addAlert(AlertType.Error, message, subtext)
        if (subtext) {
            this.logger.error(message, subtext)
        } else {
            this.logger.error(message)
        }
    }

    private addAlert(
        type: AlertType,
        message: string,
        subtext?: string[]
    ): void {
        const alert: Alert = {
            id: uuid(),
            type,
            message,
            subtext,
        }
        this.alerts.push(alert)
        this.alertSubject.next([...this.alerts])
        setTimeout(
            () => {
                this.removeAlert(alert.id)
            },
            alert.type === AlertType.Success ? 3000 : 10000
        )
    }

    removeAlert(id: string): void {
        this.alerts = this.alerts.filter((n) => n.id !== id)
        this.alertSubject.next([...this.alerts])
    }

    clearAlerts(): void {
        this.alerts = []
        this.alertSubject.next([...this.alerts])
    }
}
