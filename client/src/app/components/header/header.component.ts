import { AfterViewInit, Component, OnInit } from '@angular/core'
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterLinkActive,
} from '@angular/router'
import { catchError, filter, Observable, of, switchMap, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { NotificationService } from '../../services/notification.service'
import { UserService } from '../../services/user.service'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'
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
    styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, AfterViewInit {
    loading = false

    constructor(
        private userSvc: UserService,
        private alertSvc: AlertService,
        private authSvc: AuthService,
        private router: Router,
        private notificationSvc: NotificationService,
        private logger: LoggerService
    ) {}

    ngOnInit(): void {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .forEach(() => {
                if (this.userSvc.getStoredCurrentUser()) {
                    this.notificationSvc.loadNotifications().subscribe()
                }
            })
    }

    ngAfterViewInit(): void {
        const notificationsModal = document.getElementById('notificationsModal')
        if (notificationsModal) {
            notificationsModal.addEventListener('hidden.bs.modal', () => {
                this.updateNotificationsToRead()
                    .pipe(
                        switchMap(() =>
                            this.notificationSvc.loadNotifications()
                        ),
                        catchError(() => of(undefined))
                    )
                    .subscribe()
            })
        }
    }

    isAdmin = () => this.userSvc.getStoredCurrentUser()?.admin ?? false

    updateNotificationsToRead(): Observable<undefined> {
        return this.notificationSvc.updateAllNotificationsToRead().pipe(
            switchMap(() => {
                this.logger.debug('updated notifications to read')
                return of(undefined)
            }),
            catchError(() => of(undefined))
        )
    }

    unreadNotifications(): boolean {
        return this.notificationSvc.notifications.some(
            (notification) => !notification.read || notification.persistent
        )
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
                this.router.navigateByUrl('/logout')
            })
    }
}
