import { Component, OnInit } from '@angular/core'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
    public userName: string | undefined

    constructor(
        private userSvc: UserService,
        private alertSvc: AlertService,
        private authSvc: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const user = this.userSvc.getStoredCurrentUser()
        this.userName = user?.firstName
    }

    logout(): void {
        this.authSvc
            .logout()
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        'Logout failed. Please try again'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.userSvc.clearCurrentUser()
                this.router.navigateByUrl('/logout')
            })
    }
}
