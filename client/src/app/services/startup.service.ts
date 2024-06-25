import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, catchError, of, switchMap } from 'rxjs'
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
        private router: Router
    ) {}

    startup(): Observable<void> {
        this.logger.debug('starting up')
        return this.userSvc.currentUser().pipe(
            switchMap(() => {
                return this.getSecrets()
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('error while getting current user', err)
                this.router.navigateByUrl('/login')
                return of(undefined)
            })
        )
    }

    private getSecrets(): Observable<void> {
        return this.secretsSvc.getSecrets().pipe(
            switchMap((secrets?) => {
                if (!secrets) {
                    this.logger.error('failed to get secrets')
                    this.router.navigateByUrl('/startup-error')
                    return of(undefined)
                }
                this.logger.debug('received secrets')
                this.secretsSvc.secrets = secrets
                this.logger.configureLogtail(secrets.logtailToken)
                this.success = true
                this.logger.debug('startup complete')
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('error while getting secrets', err)
                this.router.navigateByUrl('/startup-error')
                return of(undefined)
            })
        )
    }
}
