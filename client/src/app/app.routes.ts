import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
    Routes,
} from '@angular/router'
import { RouteEnum } from '@enums/route'
import { AlertService } from '@services/alert.service'
import { CsrfService } from '@services/csrf.service'
import { createLoggerWithContext } from '@services/logger.service'
import { UserService } from '@services/user.service'

const adminRoutes: string[] = ['/admin']

const activationGuard: CanActivateFn = (
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean => {
    const userSvc = inject(UserService)
    const csrfSvc = inject(CsrfService)
    const router = inject(Router)

    const user = userSvc.user
    if (!user) {
        csrfSvc.clearToken()
        void router.navigateByUrl(RouteEnum.Login)
        addErrorAlert('Not logged in')
        return false
    }

    const route = state.url.split('?')[0]
    if (!adminRoutes.includes(route)) return true
    if (!user.admin) {
        void router.navigateByUrl(RouteEnum.Home)
        addErrorAlert('You cannot access that page')
        return false
    }
    return true
}

const addErrorAlert = (message: string) => {
    const alertSvc = inject(AlertService)
    const logger = createLoggerWithContext('AuthGuardService')
    alertSvc.addErrorAlert(logger, message)
}

export const routes: Routes = [
    {
        path: RouteEnum.StartupError,
        title: 'Startup Error',
        loadComponent: () =>
            import('./pages/startup-error/startup-error.component').then(
                (m) => m.StartupErrorComponent
            ),
    },
    {
        path: RouteEnum.Login,
        title: 'Log In',
        loadComponent: () =>
            import('./pages/login/login.component').then(
                (m) => m.LoginComponent
            ),
    },
    {
        path: RouteEnum.Logout,
        title: 'Log Out',
        loadComponent: () =>
            import('./pages/logout/logout.component').then(
                (m) => m.LogoutComponent
            ),
    },
    {
        path: RouteEnum.AccessRequest,
        title: 'Request Access',
        loadComponent: () =>
            import('./pages/access-request/access-request.component').then(
                (m) => m.AccessRequestComponent
            ),
    },
    {
        path: RouteEnum.Register,
        title: 'Register',
        loadComponent: () =>
            import('./pages/register/register.component').then(
                (m) => m.RegisterComponent
            ),
    },
    {
        path: RouteEnum.Home,
        title: 'Home',
        loadComponent: () =>
            import('./pages/home/home.component').then((m) => m.HomeComponent),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Accounts,
        title: 'Accounts',
        loadComponent: () =>
            import('./pages/accounts/accounts.component').then(
                (m) => m.AccountsComponent
            ),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Transactions,
        title: 'Transactions',
        loadComponent: () =>
            import('./pages/transactions/transactions.component').then(
                (m) => m.TransactionsComponent
            ),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Spending,
        title: 'Spending',
        loadComponent: () =>
            import('./pages/spending/spending.component').then(
                (m) => m.SpendingComponent
            ),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Investments,
        title: 'Investments',
        loadComponent: () =>
            import('./pages/investments/investments.component').then(
                (m) => m.InvestmentsComponent
            ),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Liabilities,
        title: 'Liabilities',
        loadComponent: () =>
            import('./pages/liabilities/liabilities.component').then(
                (m) => m.LiabilitiesComponent
            ),
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Admin,
        title: 'Admin',
        loadComponent: () =>
            import('./pages/admin/admin.component').then(
                (m) => m.AdminComponent
            ),
        canActivate: [activationGuard],
    },
    { path: '**', redirectTo: RouteEnum.Login },
]
