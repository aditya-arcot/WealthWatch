import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, of } from 'rxjs'
import { User } from '../../models/user'
import { AlertService } from '../../services/alert.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-logout',
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
        if (this.userSvc.user || !this.userSvc.loggedOut) {
            this.logger.info('not logged out')
            this.router.navigateByUrl('/home')
            return
        }
        this.userSvc.loggedOut = false

        this.userSvc
            .getCurrentUser()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.logger.error(err)
                    return of(undefined)
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
                this.logger.info('not logged out')
                this.router.navigateByUrl('/home')
            })
    }
}
