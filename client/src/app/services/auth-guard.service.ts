import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router'
import { NGXLogger } from 'ngx-logger'
import { AlertService } from './alert.service'
import { createLoggerWithContext, LogtailService } from './logger.service'
import { UserService } from './user.service'

const adminRoutes: string[] = ['/admin']

export const AuthGuardService: CanActivateFn = (
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean => {
    const route = state.url.split('?')[0]
    const user = inject(UserService).user
    if (!user) {
        navigateByUrl('/login')
        addErrorAlert('Not logged in')
        return false
    }
    if (!adminRoutes.includes(route)) return true
    if (!user || !user.admin) {
        navigateByUrl('/home')
        addErrorAlert('You cannot access that page')
        return false
    }
    return true
}

const navigateByUrl = (url: string) => {
    void inject(Router).navigateByUrl(url)
}

const addErrorAlert = (message: string) => {
    const ngxLogger = inject(NGXLogger)
    const logtail = inject(LogtailService)
    const logger = createLoggerWithContext(
        ngxLogger,
        logtail,
        'AuthGuardService'
    )
    inject(AlertService).addErrorAlert(logger, message)
}
