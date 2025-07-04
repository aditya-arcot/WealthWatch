import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    inject,
} from '@angular/core'
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AccessRequestErrorCodeEnum, ServerError } from '@wealthwatch-shared'
import { catchError, finalize, of, switchMap, throwError } from 'rxjs'
import { LoggerComponent } from '../../components/logger.component'
import { RouteEnum } from '../../enums/route'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-access-request',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './access-request.component.html',
    styleUrl: './access-request.component.css',
})
export class AccessRequestComponent
    extends LoggerComponent
    implements OnInit, AfterViewInit
{
    private formBuilder = inject(FormBuilder)
    private userSvc = inject(UserService)
    private router = inject(Router)
    private authSvc = inject(AuthService)
    private alertSvc = inject(AlertService)

    @ViewChild('accessRequestForm')
    accessRequestForm!: ElementRef<HTMLFormElement>
    accessRequestFormGroup: FormGroup
    loading = false

    constructor() {
        super('AccessRequestComponent')
        this.accessRequestFormGroup = this.formBuilder.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
        })
    }

    ngOnInit(): void {
        if (this.userSvc.user) {
            void this.router.navigateByUrl(RouteEnum.Home)
            this.alertSvc.addSuccessAlert(this.logger, 'Already logged in')
        }
    }

    ngAfterViewInit(): void {
        const form = this.accessRequestForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.accessRequestFormGroup.valid || !form.checkValidity()) {
                this.logger.info('validation failed')
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
                    void this.router.navigateByUrl(RouteEnum.Login)
                    this.alertSvc.addSuccessAlert(
                        this.logger,
                        'Success requesting access',
                        'Please wait for approval'
                    )
                    return of(undefined)
                }),
                catchError((err) => {
                    const code = (err.error as ServerError).code
                    if (this.handleRequestAccessError(code)) {
                        return of(undefined)
                    }
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe()
    }

    handleRequestAccessError(code?: string): boolean {
        this.logger.info('handling request access error', { code })
        if (code !== undefined) {
            switch (code) {
                case AccessRequestErrorCodeEnum.UserExists:
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        `An account with that email already exists`,
                        'Please log in'
                    )
                    void this.router.navigateByUrl(RouteEnum.Login)
                    return true
                case AccessRequestErrorCodeEnum.RequestPending:
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'A previous request with that email is pending',
                        'Please wait for approval'
                    )
                    return true
                case AccessRequestErrorCodeEnum.RequestApproved:
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'A previous request with that email has been approved',
                        'Please check your email for your access code'
                    )
                    void this.router.navigateByUrl(RouteEnum.Register)
                    return true
                case AccessRequestErrorCodeEnum.RequestRejected:
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'A previous request with that email has been rejected',
                        'Please contact an admin for further assistance'
                    )
                    return true
            }
        }
        this.alertSvc.addErrorAlert(this.logger, 'Failed to request access')
        return false
    }
}
