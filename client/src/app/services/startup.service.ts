import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, of, switchMap } from 'rxjs'
import { LoggerService } from './logger.service'
import { SecretsService } from './secrets.service'

@Injectable({
    providedIn: 'root',
})
export class StartupService {
    constructor(
        private logger: LoggerService,
        private secretsSvc: SecretsService
    ) {}

    startup(): Observable<boolean> {
        this.logger.debug('starting up')
        return this.secretsSvc.getSecrets().pipe(
            switchMap((secrets?) => {
                if (!secrets) {
                    this.logger.error('failed to get secrets')
                    return of(false)
                }
                this.logger.debug('received secrets')
                this.secretsSvc.secrets = secrets
                this.logger.configureLogtail(secrets.logtailToken)
                this.logger.debug('startup complete')
                return of(true)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('error while getting secrets', err)
                return of(false)
            })
        )
    }
}
