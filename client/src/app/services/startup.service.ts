import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, catchError, of, switchMap, throwError } from 'rxjs'
import { User } from '../models/user'
import { AlertService } from './alert.service'
import { CSRFService } from './csrf.service'
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
        private csrfSvc: CSRFService,
        private userSvc: UserService,
        private secretsSvc: SecretsService,
        private router: Router,
        private alertSvc: AlertService
    ) {}

    startup(): Observable<void> {
        this.logger.debug('starting up')
        return this.getCsrfToken().pipe(
            switchMap(() => this.getCurrentUser()),
            switchMap(() => this.getSecrets()),
            switchMap(() => {
                this.success = true
                this.logger.debug('startup complete')
                return of(undefined)
            }),
            catchError(() => {
                return of(undefined)
            })
        )
    }

    private getCsrfToken(): Observable<void> {
        return this.csrfSvc.getCsrfToken().pipe(
            switchMap((resp) => {
                this.logger.debug('received csrf token')
                this.csrfSvc.storeCsrfToken(resp.csrfToken)
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.router.navigateByUrl('/startup-error')
                this.alertSvc.addErrorAlert('Failed to get CSRF token')
                return throwError(() => err)
            })
        )
    }

    private getCurrentUser(): Observable<void> {
        return this.userSvc.getCurrentUser().pipe(
            switchMap((user?: User) => {
                if (!user) {
                    return throwError(() => new Error('no current user'))
                }
                this.logger.debug('received current user')
                this.userSvc.storeCurrentUser(user)
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.userSvc.clearStoredCurrentUser()
                this.router.navigateByUrl('/login')
                this.alertSvc.addErrorAlert('Not logged in')
                return throwError(() => err)
            })
        )
    }

    private getSecrets(): Observable<Secrets> {
        return this.secretsSvc.getSecrets().pipe(
            tap(() => this.logger.debug('received secrets')),
            catchError((err: HttpErrorResponse) => {
                this.router.navigateByUrl('/startup-error')
                this.alertSvc.addErrorAlert('Failed to get secrets')
                return throwError(() => err)
            })
        )
    }
}
