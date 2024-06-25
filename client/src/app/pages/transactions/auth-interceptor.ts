import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(
        req: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        req = req.clone({
            withCredentials: true,
        })
        return next.handle(req)
    }
}
