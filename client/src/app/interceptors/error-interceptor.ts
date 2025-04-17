import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { Router } from '@angular/router'
import { NGXLogger } from 'ngx-logger'
import { catchError, Observable, throwError } from 'rxjs'
import { ServerError } from 'wealthwatch-shared'
import { AlertService } from '../services/alert.service'
import {
    createLoggerWithContext,
    LoggerService,
    LogtailService,
} from '../services/logger.service'
import { UserService } from '../services/user.service'

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private readonly logger: LoggerService

    constructor(
        private alertSvc: AlertService,
        private userSvc: UserService,
        private router: Router,
        injector: Injector
    ) {
        const ngxLogger = injector.get(NGXLogger)
        const logtail = injector.get(LogtailService)
        this.logger = createLoggerWithContext(
            ngxLogger,
            logtail,
            'ErrorInterceptor'
        )
    }

    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            catchError((err) => {
                let errorMessage: string
                const errorSubtext: string[] = []

                if (err.error instanceof ErrorEvent) {
                    errorMessage = 'Client HTTP Error'
                    errorSubtext.push(err.message)
                } else {
                    errorMessage = `Server HTTP Error (${err.status})`
                    if (err.status === 0) {
                        errorSubtext.push('No server response')
                    } else {
                        if (err.error) {
                            const error = err.error as ServerError
                            errorSubtext.push(error.message)
                        } else if (err.statusText) {
                            errorSubtext.push(err.statusText)
                        }
                        if (err.status === 401) {
                            this.userSvc.user = undefined
                            void this.router.navigateByUrl('/login')
                            this.alertSvc.addErrorAlert(
                                this.logger,
                                'Not logged in'
                            )
                        }
                    }
                }

                this.alertSvc.addErrorAlert(
                    this.logger,
                    errorMessage,
                    ...errorSubtext
                )
                return throwError(() => err)
            })
        )
    }
}
