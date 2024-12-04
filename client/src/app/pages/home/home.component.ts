import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { User } from '../../models/user'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
    constructor(
        private userSvc: UserService,
        private router: Router,
        private logger: LoggerService
    ) {}

    ngOnInit(): void {
        this.userSvc
            .getCurrentUser()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.userSvc.clearStoredCurrentUser()
                    this.logger.error('error while getting current user')
                    this.router.navigateByUrl('/login')
                    return throwError(() => err)
                })
            )
            .subscribe((user?: User) => {
                if (!user) {
                    this.logger.info('not logged in')
                    this.router.navigateByUrl('/login')
                    return
                }
                this.userSvc.storeCurrentUser(user)
            })
    }

    get firstName() {
        return this.userSvc.getStoredCurrentUser()?.firstName
    }

    get demoUserLoggedIn() {
        return this.userSvc.demoUserLoggedIn()
    }
}
