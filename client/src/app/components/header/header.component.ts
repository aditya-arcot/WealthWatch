import { HttpErrorResponse } from '@angular/common/http'
import { AfterViewInit, Component, OnInit, inject } from '@angular/core'
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterLinkActive,
} from '@angular/router'
import { LoadingSpinnerComponent } from '@components/loading-spinner/loading-spinner.component'
import { LoggerComponent } from '@components/logger.component'
import { NotificationsComponent } from '@components/notifications/notifications.component'
import { RouteEnum } from '@enums/route'
import { AlertService } from '@services/alert.service'
import { AuthService } from '@services/auth.service'
import { NotificationService } from '@services/notification.service'
import { UserService } from '@services/user.service'
import { catchError, filter, of, switchMap, throwError } from 'rxjs'

@Component({
    selector: 'app-header',
    imports: [
        RouterLink,
        RouterLinkActive,
        NotificationsComponent,
        LoadingSpinnerComponent,
    ],
    templateUrl: './header.component.html',
})
export class HeaderComponent
    extends LoggerComponent
    implements OnInit, AfterViewInit
{
    private userSvc = inject(UserService)
    private alertSvc = inject(AlertService)
    private authSvc = inject(AuthService)
    private router = inject(Router)
    private notificationSvc = inject(NotificationService)

    loading = false

    constructor() {
        super('HeaderComponent')
    }

    ngOnInit(): void {
        void this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .forEach(() => {
                if (this.userSvc.user) {
                    this.notificationSvc.loadNotifications().subscribe()
                }
            })
    }

    ngAfterViewInit(): void {
        const notificationsModal = document.getElementById('notificationsModal')
        if (notificationsModal) {
            notificationsModal.addEventListener('hidden.bs.modal', () => {
                this.logger.info('updating notifications to read')
                this.notificationSvc
                    .updateAllNotificationsToRead()
                    .pipe(
                        switchMap(() =>
                            this.notificationSvc.loadNotifications()
                        ),
                        // silence errors
                        catchError(() => of(undefined))
                    )
                    .subscribe()
            })
        }
    }

    isAdmin = () => this.userSvc.user?.admin ?? false

    unreadNotifications(): boolean {
        return this.notificationSvc.notifications.some(
            (notification) => !notification.read || notification.persistent
        )
    }

    logout(): void {
        this.logger.info('logging out')
        this.authSvc
            .logout()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to log out'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                void this.router.navigateByUrl(RouteEnum.Logout)
            })
    }
}
