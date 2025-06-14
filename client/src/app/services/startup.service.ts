import { Injectable, Injector } from '@angular/core'
import { Router } from '@angular/router'
import { NGXLogger } from 'ngx-logger'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'
import { RouteEnum } from '../enums/route'
import { AlertService } from './alert.service'
import { CsrfService } from './csrf.service'
import {
    createLoggerWithContext,
    LoggerService,
    LogtailService,
} from './logger.service'
import { SecretsService } from './secrets.service'
import { UserService } from './user.service'

@Injectable({
    providedIn: 'root',
})
export class StartupService {
    private readonly logger: LoggerService
    success = false

    constructor(
        private csrfSvc: CsrfService,
        private userSvc: UserService,
        private secretsSvc: SecretsService,
        private router: Router,
        private alertSvc: AlertService,
        injector: Injector
    ) {
        const ngxLogger = injector.get(NGXLogger)
        const logtail = injector.get(LogtailService)
        this.logger = createLoggerWithContext(
            ngxLogger,
            logtail,
            'StartupService'
        )
    }

    startup(): Observable<void> {
        this.logger.info('starting up')
        return this.getCsrfToken().pipe(
            switchMap(() => this.getCurrentUser()),
            switchMap((userReceived) => {
                if (userReceived) return this.getSecrets()
                this.logger.info('skipping secrets')
                return of(undefined)
            }),
            switchMap(() => {
                this.success = true
                this.logger.info('startup success')
                return of(undefined)
            }),
            catchError((err) => {
                this.logger.error('startup error', { err })
                return of(undefined)
            })
        )
    }

    private getCsrfToken() {
        this.logger.info('getting csrf token')
        return this.csrfSvc.getToken().pipe(
            catchError((err) => {
                void this.router.navigateByUrl(RouteEnum.StartupError)
                this.alertSvc.addErrorAlert(
                    this.logger,
                    'Failed to get CSRF token'
                )
                return throwError(() => err)
            })
        )
    }

    private getCurrentUser() {
        this.logger.info('getting current user')
        return this.userSvc.getCurrentUser().pipe(
            switchMap((user) => {
                if (user) return of(true)
                this.logger.info('no current user')
                return of(false)
            })
        )
    }

    private getSecrets() {
        this.logger.info('getting secrets')
        return this.secretsSvc.getSecrets().pipe(
            catchError((err) => {
                void this.router.navigateByUrl(RouteEnum.StartupError)
                this.alertSvc.addErrorAlert(
                    this.logger,
                    'Failed to get secrets'
                )
                return throwError(() => err)
            })
        )
    }
}
