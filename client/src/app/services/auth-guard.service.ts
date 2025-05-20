import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router'
import { NGXLogger } from 'ngx-logger'
import { AlertService } from './alert.service'
import { CSRFService } from './csrf.service'
import { createLoggerWithContext, LogtailService } from './logger.service'
import { UserService } from './user.service'

const adminRoutes: string[] = ['/admin']

export const AuthGuardService: CanActivateFn = (
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean => {
    const userSvc = inject(UserService)
    const csrfSvc = inject(CSRFService)
    const router = inject(Router)

    const user = userSvc.user
    if (!user) {
        csrfSvc.clearToken()
        void router.navigateByUrl('/login')
        addErrorAlert('Not logged in')
        return false
    }

    const route = state.url.split('?')[0]
    if (!adminRoutes.includes(route)) return true
    if (!user || !user.admin) {
        void router.navigateByUrl('/home')
        addErrorAlert('You cannot access that page')
        return false
    }
    return true
}

const addErrorAlert = (message: string) => {
    const ngxLogger = inject(NGXLogger)
    const logtailSvc = inject(LogtailService)
    const alertSvc = inject(AlertService)

    const logger = createLoggerWithContext(
        ngxLogger,
        logtailSvc,
        'AuthGuardService'
    )
    alertSvc.addErrorAlert(logger, message)
}
