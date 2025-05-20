import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, switchMap } from 'rxjs'
import { CSRFService } from '../services/csrf.service'

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {
    private ignoreMethods = ['GET', 'HEAD', 'OPTIONS']

    constructor(private csrfSvc: CSRFService) {}

    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        if (this.ignoreMethods.includes(req.method)) return next.handle(req)
        return this.csrfSvc.getToken().pipe(
            switchMap((resp) => {
                return next.handle(
                    req.clone({
                        setHeaders: {
                            'x-csrf-token': resp.csrfToken,
                        },
                    })
                )
            })
        )
    }
}
