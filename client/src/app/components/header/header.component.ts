import { AfterViewInit, Component, Injector, OnInit } from '@angular/core'
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterLinkActive,
} from '@angular/router'
import { catchError, filter, of, switchMap, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { NotificationService } from '../../services/notification.service'
import { UserService } from '../../services/user.service'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'
import { LoggerComponent } from '../logger.component'
import { NotificationsComponent } from '../notifications/notifications.component'

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
    loading = false

    constructor(
        private userSvc: UserService,
        private alertSvc: AlertService,
        private authSvc: AuthService,
        private router: Router,
        private notificationSvc: NotificationService,
        injector: Injector
    ) {
        super(injector, 'HeaderComponent')
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
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to log out. Please try again'
                    )
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                void this.router.navigateByUrl('/logout')
            })
    }
}
