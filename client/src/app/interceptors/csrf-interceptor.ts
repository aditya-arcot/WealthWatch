import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { CSRFService } from '../services/csrf.service'

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {
    constructor(private csrfSvc: CSRFService) {}

    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        const csrfToken = this.csrfSvc.getStoredCsrfToken()
        if (csrfToken !== null) {
            req = req.clone({
                setHeaders: {
                    'x-csrf-token': csrfToken,
                },
            })
        }
        return next.handle(req)
    }
}
