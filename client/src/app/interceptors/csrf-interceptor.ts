import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { switchMap } from 'rxjs'
import { CSRFService } from '../services/csrf.service'

const ignoreMethods = ['GET', 'HEAD', 'OPTIONS']

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    if (ignoreMethods.includes(req.method)) return next(req)

    const csrfSvc = inject(CSRFService)
    return csrfSvc.getToken().pipe(
        switchMap((resp) => {
            return next(
                req.clone({
                    setHeaders: {
                        'x-csrf-token': resp.csrfToken,
                    },
                })
            )
        })
    )
}
