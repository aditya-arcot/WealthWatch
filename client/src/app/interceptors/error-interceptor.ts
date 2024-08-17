import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, Observable, throwError } from 'rxjs'
import { AlertService } from '../services/alert.service'
import { UserService } from '../services/user.service'

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private alertSvc: AlertService,
        private userSvc: UserService,
        private router: Router
    ) {}

    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage: string
                const errorSubtext: string[] = []
                if (error.error instanceof ErrorEvent) {
                    errorMessage = 'Client HTTP Error'
                    errorSubtext.push(error.message)
                } else {
                    errorMessage = `Server HTTP Error (${error.status})`
                    if (error.status === 0) {
                        errorSubtext.push('No server response')
                    } else {
                        errorSubtext.push(error.error)
                        if (error.status === 401) {
                            this.userSvc.clearCurrentUser()
                            this.router.navigateByUrl('/login')
                            this.alertSvc.clearAlerts()
                            this.alertSvc.addErrorAlert('Not logged in')
                        }
                    }
                }
                this.alertSvc.addErrorAlert(errorMessage, errorSubtext)
                return throwError(() => error)
            })
        )
    }
}
