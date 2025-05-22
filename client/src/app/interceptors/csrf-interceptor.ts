import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { switchMap } from 'rxjs'
import { CsrfService } from '../services/csrf.service'

const ignoreMethods = ['GET', 'HEAD', 'OPTIONS']

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    if (ignoreMethods.includes(req.method)) return next(req)

    const csrfSvc = inject(CsrfService)
    return csrfSvc.getToken().pipe(
        switchMap((resp) => {
            return next(
                req.clone({
                    setHeaders: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        'x-csrf-token': resp.csrfToken,
                    },
                })
            )
        })
    )
}
