import { Component, Injector, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, of } from 'rxjs'
import { LoggerComponent } from '../../components/logger.component'
import { AlertService } from '../../services/alert.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
})
export class LogoutComponent extends LoggerComponent implements OnInit {
    constructor(
        private router: Router,
        private alertSvc: AlertService,
        private userSvc: UserService,
        injector: Injector
    ) {
        super(injector, 'LogoutComponent')
    }

    ngOnInit(): void {
        if (this.userSvc.user || !this.userSvc.loggedOut) {
            this.logger.info('not logged out')
            this.router.navigateByUrl('/home')
            return
        }
        this.userSvc.loggedOut = false
        this.checkLoggedOut()
    }

    checkLoggedOut() {
        this.logger.info('checking logged out')
        this.userSvc
            .getCurrentUser()
            .pipe(
                // silence errors
                catchError(() => of(undefined))
            )
            .subscribe((user) => {
                if (!user) {
                    this.logger.info('logged out')
                    setTimeout(() => {
                        this.router.navigateByUrl('/login')
                        this.alertSvc.addSuccessAlert(
                            this.logger,
                            'Success logging out'
                        )
                    }, 2000)
                    return
                }
                this.logger.info('not logged out')
                this.router.navigateByUrl('/home')
            })
    }
}
