import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { ServerError } from 'wealthwatch-shared'
import { RouteEnum } from '../enums/route'
import { AlertService } from '../services/alert.service'
import { CsrfService } from '../services/csrf.service'
import { createLoggerWithContext } from '../services/logger.service'
import { UserService } from '../services/user.service'

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const userSvc = inject(UserService)
    const csrfSvc = inject(CsrfService)
    const router = inject(Router)
    const alertSvc = inject(AlertService)
    const logger = createLoggerWithContext('ErrorInterceptor')

    return next(req).pipe(
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
                    if (err.status === 401) {
                        userSvc.user = undefined
                        csrfSvc.clearToken()
                        void router.navigateByUrl(RouteEnum.Login)
                        alertSvc.addErrorAlert(logger, 'Not logged in')
                        return throwError(() => err)
                    }
                    if (err.error) {
                        const error = err.error as ServerError
                        errorSubtext.push(error.message)
                    } else if (err.statusText) {
                        errorSubtext.push(err.statusText)
                    }
                }
            }

            alertSvc.addErrorAlert(logger, errorMessage, ...errorSubtext)
            return throwError(() => err)
        })
    )
}
