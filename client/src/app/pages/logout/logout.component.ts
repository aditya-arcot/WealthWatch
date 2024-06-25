import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
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
        private router: Router
    ) {}

    ngOnInit(): void {
        this.authSvc
            .logout()
            .pipe(
                catchError((err) => {
                    this.logger.error('error while logging out', err)
                    this.router.navigateByUrl('/home')
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.logger.info('logged out')
                setTimeout(() => {
                    this.router.navigateByUrl('/login')
                }, 3000)
            })
    }
}
