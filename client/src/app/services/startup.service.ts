import { HttpErrorResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { NGXLogger } from 'ngx-logger'
import { Observable, catchError, of, switchMap } from 'rxjs'
import { SecretsService } from './secrets.service'

@Injectable({
    providedIn: 'root',
})
export class StartupService {
    constructor(
        private logger: NGXLogger,
        private secretsSvc: SecretsService
    ) {}

    startup(): Observable<boolean> {
        this.logger.debug('app startup')
        return this.secretsSvc.getSecrets().pipe(
            switchMap((secrets?) => {
                if (!secrets) {
                    this.logger.error('failed to get secrets')
                    return of(false)
                }
                this.secretsSvc.secrets = secrets
                this.logger.debug('received secrets')
                return of(true)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('error while getting secrets', err)
                return of(false)
            })
        )
    }
}
