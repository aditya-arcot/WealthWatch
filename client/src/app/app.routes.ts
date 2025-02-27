import { Routes } from '@angular/router'
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
import { AuthGuardService } from './services/auth-guard.service'

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
        canActivate: [AuthGuardService],
    },
    {
        path: 'accounts',
        title: 'Accounts',
        component: AccountsComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: 'transactions',
        title: 'Transactions',
        component: TransactionsComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: 'spending',
        title: 'Spending',
        component: SpendingComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: 'investments',
        title: 'Investments',
        component: InvestmentsComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: 'liabilities',
        title: 'Liabilities',
        component: LiabilitiesComponent,
        canActivate: [AuthGuardService],
    },
    // { path: 'net-worth', title: 'Net Worth', component: NetWorthComponent, canActivate: [AuthGuardService] },
    // { path: 'paychecks', title: 'Paychecks', component: PaychecksComponent, canActivate: [AuthGuardService] },
    {
        path: 'admin',
        title: 'Admin',
        component: AdminComponent,
        canActivate: [AuthGuardService],
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
]
