import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
    Routes,
} from '@angular/router'
import { NGXLogger } from 'ngx-logger'
import { RouteEnum } from './enums/route'
import { AccessRequestComponent } from './pages/access-request/access-request.component'
import { AccountsComponent } from './pages/accounts/accounts.component'
import { AdminComponent } from './pages/admin/admin.component'
import { HomeComponent } from './pages/home/home.component'
import { InvestmentsComponent } from './pages/investments/investments.component'
import { LiabilitiesComponent } from './pages/liabilities/liabilities.component'
import { LoginComponent } from './pages/login/login.component'
import { LogoutComponent } from './pages/logout/logout.component'
import { RegisterComponent } from './pages/register/register.component'
import { SpendingComponent } from './pages/spending/spending.component'
import { StartupErrorComponent } from './pages/startup-error/startup-error.component'
import { TransactionsComponent } from './pages/transactions/transactions.component'
import { AlertService } from './services/alert.service'
import { CsrfService } from './services/csrf.service'
import {
    LogtailService,
    createLoggerWithContext,
} from './services/logger.service'
import { UserService } from './services/user.service'

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
    if (!user || !user.admin) {
        void router.navigateByUrl(RouteEnum.Home)
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

export const routes: Routes = [
    {
        path: RouteEnum.StartupError,
        title: 'Startup Error',
        component: StartupErrorComponent,
    },
    {
        path: RouteEnum.Login,
        title: 'Log In',
        component: LoginComponent,
    },
    {
        path: RouteEnum.Logout,
        title: 'Log Out',
        component: LogoutComponent,
    },
    {
        path: RouteEnum.AccessRequest,
        title: 'Request Access',
        component: AccessRequestComponent,
    },
    {
        path: RouteEnum.Register,
        title: 'Register',
        component: RegisterComponent,
    },
    {
        path: RouteEnum.Home,
        title: 'Home',
        component: HomeComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Accounts,
        title: 'Accounts',
        component: AccountsComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Transactions,
        title: 'Transactions',
        component: TransactionsComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Spending,
        title: 'Spending',
        component: SpendingComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Investments,
        title: 'Investments',
        component: InvestmentsComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Liabilities,
        title: 'Liabilities',
        component: LiabilitiesComponent,
        canActivate: [activationGuard],
    },
    {
        path: RouteEnum.Admin,
        title: 'Admin',
        component: AdminComponent,
        canActivate: [activationGuard],
    },
    { path: '', redirectTo: RouteEnum.Login, pathMatch: 'full' },
    { path: '**', redirectTo: RouteEnum.Login },
]
