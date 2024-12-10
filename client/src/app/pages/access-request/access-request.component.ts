import { HttpErrorResponse } from '@angular/common/http'
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { catchError, finalize, of, switchMap, throwError } from 'rxjs'
import { AccessRequestErrorCodeEnum, ServerError } from '../../models/error'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-access-request',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './access-request.component.html',
    styleUrl: './access-request.component.css',
})
export class AccessRequestComponent implements OnInit, AfterViewInit {
    @ViewChild('accessRequestForm')
    accessRequestForm!: ElementRef<HTMLFormElement>
    accessRequestFormGroup: FormGroup
    loading = false

    constructor(
        private formBuilder: FormBuilder,
        private logger: LoggerService,
        private userSvc: UserService,
        private router: Router,
        private authSvc: AuthService,
        private alertSvc: AlertService
    ) {
        this.accessRequestFormGroup = this.formBuilder.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
        })
    }

    ngOnInit(): void {
        if (this.userSvc.user) {
            this.router.navigateByUrl('/home')
            this.alertSvc.clearAlerts()
            this.alertSvc.addSuccessAlert('Already logged in')
        }
    }

    ngAfterViewInit(): void {
        this.logger.info('adding event listener')
        const form = this.accessRequestForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.accessRequestFormGroup.valid || !form.checkValidity()) {
                this.logger.error('validation error')
                submitEvent.preventDefault()
                submitEvent.stopPropagation()
            } else {
                this.requestAccess()
            }
            form.classList.add('was-validated')
        })
    }

    requestAccess() {
        this.logger.info('requesting access')
        this.loading = true

        const firstName = this.accessRequestFormGroup.value.firstName
        const lastName = this.accessRequestFormGroup.value.lastName
        const email = this.accessRequestFormGroup.value.email

        this.authSvc
            .requestAccess(firstName, lastName, email)
            .pipe(
                switchMap(() => {
                    this.router.navigateByUrl('/login')
                    this.alertSvc.clearAlerts()
                    this.alertSvc.addSuccessAlert('Success requesting access', [
                        'Please wait for approval',
                    ])
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    const code = (err.error as ServerError).code
                    if (code !== 'undefined') {
                        switch (code) {
                            case AccessRequestErrorCodeEnum.UserExists:
                                this.alertSvc.clearAlerts()
                                this.alertSvc.addErrorAlert(
                                    `An account with that email already exists`,
                                    ['Please log in']
                                )
                                this.router.navigateByUrl('/login')
                                break
                            case AccessRequestErrorCodeEnum.RequestPending:
                                this.alertSvc.clearAlerts()
                                this.alertSvc.addErrorAlert(
                                    'A previous request with that email is pending',
                                    ['Please wait for approval']
                                )
                                break
                            case AccessRequestErrorCodeEnum.RequestApproved:
                                this.alertSvc.clearAlerts()
                                this.alertSvc.addErrorAlert(
                                    'A previous request with that email has been approved',
                                    [
                                        'Please check your email for your access code',
                                    ]
                                )
                                this.router.navigateByUrl('/register')
                                break
                            case AccessRequestErrorCodeEnum.RequestRejected:
                                this.alertSvc.clearAlerts()
                                this.alertSvc.addErrorAlert(
                                    'A previous request with that email has been rejected',
                                    [
                                        'Please contact an admin for further assistance',
                                    ]
                                )
                        }
                        return of(undefined)
                    }
                    this.alertSvc.addErrorAlert(
                        'Access request failed. Please try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe()
    }
}
