import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { RouteEnum } from '@enums/route'
import { AlertService } from '@services/alert.service'
import { CsrfService } from '@services/csrf.service'
import {
    createLoggerWithContext,
    LoggerService,
} from '@services/logger.service'
import { SecretsService } from '@services/secrets.service'
import { UserService } from '@services/user.service'
import { catchError, Observable, of, switchMap, throwError } from 'rxjs'

@Injectable({
    providedIn: 'root',
})
export class StartupService {
    private csrfSvc = inject(CsrfService)
    private userSvc = inject(UserService)
    private secretsSvc = inject(SecretsService)
    private router = inject(Router)
    private alertSvc = inject(AlertService)

    private readonly logger: LoggerService
    success = false

    constructor() {
        this.logger = createLoggerWithContext('StartupService')
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
