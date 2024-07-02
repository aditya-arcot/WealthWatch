import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core'
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import {
    catchError,
    finalize,
    forkJoin,
    map,
    of,
    switchMap,
    tap,
    throwError,
} from 'rxjs'
import { User } from '../../models/user'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, AfterViewInit {
    @ViewChild('registerForm') registerForm!: ElementRef<HTMLFormElement>
    registerFormGroup: FormGroup
    loading = false

    constructor(
        private formBuilder: FormBuilder,
        private logger: LoggerService,
        private userSvc: UserService,
        private router: Router,
        private authSvc: AuthService,
        private alertSvc: AlertService
    ) {
        this.registerFormGroup = this.formBuilder.group(
            {
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],
                email: ['', [Validators.required, Validators.email]],
                username: ['', [Validators.required]],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
            },
            { validators: this.validateConfirmPassword }
        )
    }

    ngOnInit(): void {
        this.userSvc
            .getSessionUser()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.userSvc.clearCurrentUser()
                    this.logger.error('error while getting current user')
                    return throwError(() => err)
                })
            )
            .subscribe((user?: User) => {
                if (!user) {
                    this.logger.info('not logged in')
                    return
                }
                this.userSvc.storeCurrentUser(user)
                this.router.navigateByUrl('/home')
                this.alertSvc.clearAlerts()
                this.alertSvc.addSuccessAlert('Already logged in')
            })
    }

    ngAfterViewInit(): void {
        this.logger.info('adding event listener')
        const form = this.registerForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.registerFormGroup.valid || !form.checkValidity()) {
                this.logger.error('validation error')
                submitEvent.preventDefault()
                submitEvent.stopPropagation()
            } else {
                this.register()
            }
            form.classList.add('was-validated')
        })
    }

    validateConfirmPassword(control: AbstractControl) {
        const password: string = control.get('password')?.value
        const confirmPassword: string = control.get('confirmPassword')?.value
        if (password !== confirmPassword) {
            return { mismatchedPasswords: true }
        }
        return null
    }

    setConfirmPasswordValidity(input: HTMLInputElement) {
        if (this.registerFormGroup.controls['confirmPassword'].errors) {
            for (const err in this.registerFormGroup.controls['confirmPassword']
                .errors) {
                input.setCustomValidity(
                    this.registerFormGroup.controls['confirmPassword'].errors[
                        err
                    ]
                )
            }
        } else if (this.registerFormGroup.errors) {
            for (const err in this.registerFormGroup.errors) {
                input.setCustomValidity(this.registerFormGroup.errors[err])
            }
        } else {
            input.setCustomValidity('')
        }
    }

    register() {
        this.logger.info('registering')
        this.loading = true

        const firstName = this.registerFormGroup.value.firstName
        const lastName = this.registerFormGroup.value.lastName
        const email = this.registerFormGroup.value.email
        const username = this.registerFormGroup.value.username
        const password = this.registerFormGroup.value.password

        forkJoin({
            usernameInUse: this.userSvc.checkUsernameInUse(username),
            emailInUse: this.userSvc.checkEmailInUse(email),
        })
            .pipe(
                switchMap((res) => {
                    if (res.emailInUse || res.usernameInUse) {
                        if (res.emailInUse) {
                            this.alertSvc.addErrorAlert(
                                'Email is already in use'
                            )
                            this.registerFormGroup.patchValue({
                                email: '',
                                confirmPassword: '',
                            })
                        }
                        if (res.usernameInUse) {
                            this.alertSvc.addErrorAlert(
                                'Username is already in use'
                            )
                            this.registerFormGroup.patchValue({
                                username: '',
                                confirmPassword: '',
                            })
                        }
                        return of(false)
                    }
                    return this.authSvc
                        .register(
                            firstName,
                            lastName,
                            email,
                            username,
                            password
                        )
                        .pipe(
                            tap((user) => this.userSvc.storeCurrentUser(user)),
                            map(() => true)
                        )
                }),
                catchError((err: HttpErrorResponse) => {
                    this.alertSvc.addErrorAlert(
                        'Registration failed. Try again'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((res) => {
                if (res) {
                    this.router.navigateByUrl('/home')
                    this.alertSvc.clearAlerts()
                    this.alertSvc.addSuccessAlert('Success signing up')
                }
            })
    }
}
