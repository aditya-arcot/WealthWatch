import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, catchError, of, switchMap, throwError } from 'rxjs'
import { User } from '../models/user'
import { AlertService } from './alert.service'
import { LoggerService } from './logger.service'
import { SecretsService } from './secrets.service'
import { UserService } from './user.service'

@Injectable({
    providedIn: 'root',
})
export class StartupService {
    success = false

    constructor(
        private logger: LoggerService,
        private userSvc: UserService,
        private secretsSvc: SecretsService,
        private router: Router,
        private alertSvc: AlertService
    ) {}

    startup(): Observable<void> {
        this.logger.debug('starting up')
        return this.userSvc.currentUser().pipe(
            switchMap((user?: User) => {
                if (!user) {
                    return throwError(() => new Error('not logged in'))
                }
                this.logger.debug('received current user')
                return this.getSecrets()
            }),
            catchError((err: HttpErrorResponse) => {
                this.router.navigateByUrl('/login')
                this.logger.error('error while getting current user', err)
                this.alertSvc.clearAlerts()
                this.alertSvc.addErrorAlert('Not logged in')
                return of(undefined)
            })
        )
    }

    private getSecrets(): Observable<void> {
        return this.secretsSvc.getSecrets().pipe(
            switchMap((secrets?) => {
                if (!secrets) {
                    return throwError(() => new Error('no secrets'))
                }
                this.logger.debug('received secrets')
                this.secretsSvc.secrets = secrets
                this.logger.configureLogtail(secrets.logtailToken)
                this.success = true
                this.logger.debug('startup complete')
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.router.navigateByUrl('/startup-error')
                this.logger.error('error while getting secrets', err)
                this.alertSvc.addErrorAlert('Failed to receive secrets')
                return of(undefined)
            })
        )
    }
}
