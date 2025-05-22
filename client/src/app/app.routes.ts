import { inject } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
    Routes,
} from '@angular/router'
import { NGXLogger } from 'ngx-logger'
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

export const routes: Routes = [
    {
        path: 'startup-error',
        title: 'Startup Error',
        component: StartupErrorComponent,
    },
    { path: 'login', title: 'Log In', component: LoginComponent },
    { path: 'logout', title: 'Log Out', component: LogoutComponent },
    {
        path: 'access-request',
        title: 'Request Access',
        component: AccessRequestComponent,
    },
    { path: 'register', title: 'Register', component: RegisterComponent },
    {
        path: 'home',
        title: 'Home',
        component: HomeComponent,
        canActivate: [activationGuard],
    },
    {
        path: 'accounts',
        title: 'Accounts',
        component: AccountsComponent,
        canActivate: [activationGuard],
    },
    {
        path: 'transactions',
        title: 'Transactions',
        component: TransactionsComponent,
        canActivate: [activationGuard],
    },
    {
        path: 'spending',
        title: 'Spending',
        component: SpendingComponent,
        canActivate: [activationGuard],
    },
    {
        path: 'investments',
        title: 'Investments',
        component: InvestmentsComponent,
        canActivate: [activationGuard],
    },
    {
        path: 'liabilities',
        title: 'Liabilities',
        component: LiabilitiesComponent,
        canActivate: [activationGuard],
    },
    // { path: 'net-worth', title: 'Net Worth', component: NetWorthComponent, canActivate: [AuthGuardService] },
    // { path: 'paychecks', title: 'Paychecks', component: PaychecksComponent, canActivate: [AuthGuardService] },
    {
        path: 'admin',
        title: 'Admin',
        component: AdminComponent,
        canActivate: [activationGuard],
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
]
