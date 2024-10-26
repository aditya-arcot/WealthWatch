import { Routes } from '@angular/router'
import { AccessRequestComponent } from './pages/access-request/access-request.component'
import { AccountsComponent } from './pages/accounts/accounts.component'
import { AdminComponent } from './pages/admin/admin.component'
import { HomeComponent } from './pages/home/home.component'
import { InvestmentsComponent } from './pages/investments/investments.component'
import { LoginComponent } from './pages/login/login.component'
import { LogoutComponent } from './pages/logout/logout.component'
import { RegisterComponent } from './pages/register/register.component'
import { SpendingComponent } from './pages/spending/spending.component'
import { StartupErrorComponent } from './pages/startup-error/startup-error.component'
import { TransactionsComponent } from './pages/transactions/transactions.component'
import { AuthGuardService } from './services/auth-guard.service'

export const routes: Routes = [
    { path: 'startup-error', component: StartupErrorComponent },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'access-request', component: AccessRequestComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent },
    { path: 'accounts', component: AccountsComponent },
    { path: 'transactions', component: TransactionsComponent },
    { path: 'spending', component: SpendingComponent },
    { path: 'investments', component: InvestmentsComponent },
    // { path: 'net-worth', component: NetWorthComponent },
    // { path: 'paychecks', component: PaychecksComponent },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuardService],
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
]
