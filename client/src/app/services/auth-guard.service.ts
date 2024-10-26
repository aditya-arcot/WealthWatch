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
    if (!adminRoutes.includes(state.url)) return true
    const user = inject(UserService).getStoredCurrentUser()
    if (!user || !user.admin) {
        inject(Router).navigateByUrl('/home')
        inject(AlertService).addErrorAlert('You cannot access that page')
        return false
    }
    return true
}
