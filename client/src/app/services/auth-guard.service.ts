import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router'
import { AlertService } from './alert.service'
import { UserService } from './user.service'

const adminRoutes: string[] = ['/admin']

export const AuthGuardService: CanActivateFn = (
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean => {
    const route = state.url.split('?')[0]
    const user = inject(UserService).getStoredCurrentUser()
    if (!user) {
        inject(Router).navigateByUrl('/login')
        inject(AlertService).addErrorAlert('Not logged in')
        return false
    }
    if (!adminRoutes.includes(route)) return true
    if (!user || !user.admin) {
        inject(Router).navigateByUrl('/home')
        inject(AlertService).addErrorAlert('You cannot access that page')
        return false
    }
    return true
}
