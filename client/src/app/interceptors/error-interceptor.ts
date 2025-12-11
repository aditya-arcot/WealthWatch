import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { RouteEnum } from '@enums/route'
import { AlertService } from '@services/alert.service'
import { CsrfService } from '@services/csrf.service'
import { createLoggerWithContext } from '@services/logger.service'
import { UserService } from '@services/user.service'
import { ServerError } from '@wealthwatch-shared'
import { catchError, throwError } from 'rxjs'

function isServerError(e: unknown): e is ServerError {
    return typeof e === 'object' && e !== null && 'message' in e
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const userSvc = inject(UserService)
    const csrfSvc = inject(CsrfService)
    const router = inject(Router)
    const alertSvc = inject(AlertService)
    const logger = createLoggerWithContext('ErrorInterceptor')

    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            let errorMessage = ''
            const errorSubtext: string[] = []

            if (err.error instanceof ErrorEvent) {
                errorMessage = 'Client HTTP Error'
                errorSubtext.push(err.message)
            } else {
                if (err.status === 0) {
                    errorMessage = 'Network Error'
                    errorSubtext.push('No server response')
                } else {
                    errorMessage = `Server HTTP Error (${String(err.status)})`
                    if (err.status === 401) {
                        userSvc.user = undefined
                        csrfSvc.clearToken()
                        void router.navigateByUrl(RouteEnum.Login)
                        alertSvc.addErrorAlert(logger, 'Not logged in')
                        return throwError(() => err)
                    }
                    if (isServerError(err.error))
                        errorSubtext.push(err.error.message)
                    else logger.warn('Unexpected error payload', { err })
                }
            }

            alertSvc.addErrorAlert(logger, errorMessage, ...errorSubtext)
            return throwError(() => err)
        })
    )
}
