import { Routes } from '@angular/router'
import { HomeComponent } from './pages/home/home.component'
import { LoginComponent } from './pages/login/login.component'
import { LogoutComponent } from './pages/logout/logout.component'
import { RegisterComponent } from './pages/register/register.component'
import { StartupErrorComponent } from './pages/startup-error/startup-error.component'
import { TransactionsComponent } from './pages/transactions/transactions.component'

export const routes: Routes = [
    { path: 'startup-error', component: StartupErrorComponent },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent },
    { path: 'transactions', component: TransactionsComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home', pathMatch: 'full' },
]
