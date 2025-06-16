import { Component, OnInit, inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, of } from 'rxjs'
import { RouteEnum } from 'src/app/enums/route'
import { CsrfService } from 'src/app/services/csrf.service'
import { LoggerComponent } from '../../components/logger.component'
import { AlertService } from '../../services/alert.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
})
export class LogoutComponent extends LoggerComponent implements OnInit {
    private router = inject(Router)
    private alertSvc = inject(AlertService)
    private userSvc = inject(UserService)
    private csrfService = inject(CsrfService)

    constructor() {
        super('LogoutComponent')
    }

    ngOnInit(): void {
        if (this.userSvc.user || !this.userSvc.loggedOut) {
            this.logger.info('not logged out')
            void this.router.navigateByUrl(RouteEnum.Home)
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
                    this.csrfService.clearToken()
                    setTimeout(() => {
                        void this.router.navigateByUrl(RouteEnum.Login)
                        this.alertSvc.addSuccessAlert(
                            this.logger,
                            'Success logging out'
                        )
                    }, 2000)
                    return
                }
                this.logger.info('not logged out')
                void this.router.navigateByUrl(RouteEnum.Home)
            })
    }
}
