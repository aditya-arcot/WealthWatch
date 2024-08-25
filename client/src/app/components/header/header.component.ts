import { HttpErrorResponse } from '@angular/common/http'
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterLinkActive,
} from '@angular/router'
import { catchError, filter, Observable, of, switchMap, throwError } from 'rxjs'
import { Notification } from '../../models/notification'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { NotificationService } from '../../services/notification.service'
import { UserService } from '../../services/user.service'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'
import { NotificationsComponent } from '../notifications/notifications.component'

@Component({
    selector: 'app-header',
    standalone: true,
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
    @ViewChild(NotificationsComponent)
    notificationsComponent!: NotificationsComponent
    notifications: Notification[] = []
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
        this.loadNotifications().subscribe()
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .forEach(() => {
                if (this.userSvc.getStoredCurrentUser()) {
                    this.loadNotifications().subscribe()
                }
            })
    }

    ngAfterViewInit(): void {
        const notificationsModal = document.getElementById('notificationsModal')
        if (notificationsModal) {
            notificationsModal.addEventListener('hidden.bs.modal', () => {
                this.handleCloseNotificationsModal()
            })
        }
    }

    loadNotifications(): Observable<undefined> {
        return this.notificationSvc.getNotifications().pipe(
            switchMap((notifications) => {
                this.logger.debug('loaded notifications', notifications)
                this.notifications = notifications
                return of(undefined)
            }),
            catchError((err: HttpErrorResponse) => {
                this.logger.error('failed to load notifications', err)
                return throwError(() => err)
            })
        )
    }

    updateNotificationsToRead(): Observable<undefined> {
        return this.notificationSvc
            .updateNotificationsToRead(this.notifications)
            .pipe(
                switchMap(() => {
                    this.logger.debug('updated notifications to read')
                    return of(undefined)
                }),
                catchError(() => of(undefined))
            )
    }

    openNotificationsModal(): void {
        this.notificationsComponent.notifications = this.notifications
    }

    handleCloseNotificationsModal(): void {
        this.updateNotificationsToRead()
            .pipe(
                switchMap(() => this.loadNotifications()),
                catchError(() => of(undefined))
            )
            .subscribe()
    }

    unreadNotifications(): boolean {
        return this.notifications.some((notification) => !notification.read)
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
                this.userSvc.clearStoredCurrentUser()
                this.router.navigateByUrl('/logout')
            })
    }
}
