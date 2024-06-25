import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'

@Component({
    selector: 'app-logout',
    standalone: true,
    imports: [],
    templateUrl: './logout.component.html',
})
export class LogoutComponent implements OnInit {
    constructor(
        private authSvc: AuthService,
        private logger: LoggerService,
        private router: Router,
        private alertSvc: AlertService
    ) {}

    ngOnInit(): void {
        this.authSvc
            .logout()
            .pipe(
                catchError((err) => {
                    this.router.navigateByUrl('/home')
                    this.alertSvc.clearAlerts()
                    this.alertSvc.addErrorAlert('Logout failed')
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                setTimeout(() => {
                    this.router.navigateByUrl('/login')
                    this.alertSvc.clearAlerts()
                    this.alertSvc.addSuccessAlert('Success signing out')
                }, 3000)
            })
    }
}
