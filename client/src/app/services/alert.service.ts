import { Injectable } from '@angular/core'
import { AlertTypeEnum } from '@enums/alert'
import { Alert } from '@models/alert'
import { LoggerService } from '@services/logger.service'
import { BehaviorSubject, Observable } from 'rxjs'
import { v4 as uuid } from 'uuid'

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    private alerts: Alert[] = []
    private alertSubject = new BehaviorSubject<Alert[]>([])

    getAlerts(): Observable<Alert[]> {
        return this.alertSubject.asObservable()
    }

    addSuccessAlert(
        logger: LoggerService,
        message: string,
        ...subtext: string[]
    ): void {
        this.addAlert(AlertTypeEnum.Success, message, subtext)
        if (subtext.length) logger.info(message, { subtext })
        else logger.info(message)
    }

    addErrorAlert(
        logger: LoggerService,
        message: string,
        ...subtext: string[]
    ): void {
        this.addAlert(AlertTypeEnum.Error, message, subtext)
        if (subtext.length) logger.error(message, { subtext })
        else logger.error(message)
    }

    private addAlert(
        type: AlertTypeEnum,
        message: string,
        subtext: string[]
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
            alert.type === AlertTypeEnum.Success ? 5000 : 15000
        )
    }

    removeAlert(id: string): void {
        this.alerts = this.alerts.filter((n) => n.id !== id)
        this.alertSubject.next([...this.alerts])
    }
}
