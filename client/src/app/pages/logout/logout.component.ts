import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { User } from '../../models/user'
import { AlertService } from '../../services/alert.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-logout',
    standalone: true,
    templateUrl: './logout.component.html',
})
export class LogoutComponent implements OnInit {
    constructor(
        private router: Router,
        private alertSvc: AlertService,
        private userSvc: UserService,
        private logger: LoggerService
    ) {}

    ngOnInit(): void {
        this.userSvc
            .getCurrentUser()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.userSvc.clearStoredCurrentUser()
                    this.logger.error('error while getting current user')
                    return throwError(() => err)
                })
            )
            .subscribe((user?: User) => {
                if (!user) {
                    this.logger.info('logged out')
                    setTimeout(() => {
                        this.router.navigateByUrl('/login')
                        this.alertSvc.clearAlerts()
                        this.alertSvc.addSuccessAlert('Success logging out')
                    }, 3000)
                    return
                }
                this.userSvc.storeCurrentUser(user)
                this.router.navigateByUrl('/home')
                this.alertSvc.clearAlerts()
                this.alertSvc.addErrorAlert('Cannot access this page')
            })
    }
}
