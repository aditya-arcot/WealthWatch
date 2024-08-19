import { Routes } from '@angular/router'
import { AccountsComponent } from './pages/accounts/accounts.component'
import { HomeComponent } from './pages/home/home.component'
import { LoginComponent } from './pages/login/login.component'
import { LogoutComponent } from './pages/logout/logout.component'
import { NetWorthComponent } from './pages/net-worth/net-worth.component'
import { PaychecksComponent } from './pages/paychecks/paychecks.component'
import { RegisterComponent } from './pages/register/register.component'
import { SpendingComponent } from './pages/spending/spending.component'
import { StartupErrorComponent } from './pages/startup-error/startup-error.component'
import { TransactionsComponent } from './pages/transactions/transactions.component'

export const routes: Routes = [
    { path: 'startup-error', component: StartupErrorComponent },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent },
    { path: 'accounts', component: AccountsComponent },
    { path: 'transactions', component: TransactionsComponent },
    { path: 'spending', component: SpendingComponent },
    { path: 'net-worth', component: NetWorthComponent },
    { path: 'paychecks', component: PaychecksComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home', pathMatch: 'full' },
]
