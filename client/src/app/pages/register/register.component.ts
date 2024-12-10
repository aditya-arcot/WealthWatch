import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { catchError, finalize, of, switchMap, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
    @ViewChild('accessCodeForm') accessCodeForm!: ElementRef<HTMLFormElement>
    @ViewChild('registerForm') registerForm!: ElementRef<HTMLFormElement>

    loading = false
    accessCodeFormGroup: FormGroup
    registerFormGroup: FormGroup
    accessCodeValidated = false
    accessCode = ''
    name = ''
    email = ''

    constructor(
        private formBuilder: FormBuilder,
        private logger: LoggerService,
        private userSvc: UserService,
        private router: Router,
        private authSvc: AuthService,
        private alertSvc: AlertService
    ) {
        this.accessCodeFormGroup = this.formBuilder.group({
            accessCode: [],
        })
        this.registerFormGroup = this.formBuilder.group(
            {
                username: [],
                password: [],
                confirmPassword: [],
            },
            { validators: this.validateConfirmPassword }
        )
    }

    ngOnInit(): void {
        if (this.userSvc.user) {
            this.router.navigateByUrl('/home')
            this.alertSvc.clearAlerts()
            this.alertSvc.addSuccessAlert('Already logged in')
        }
    }

    handleAccessCodeFormKeypress = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            this.validateAccessCodeForm()
        }
    }

    handleRegisterFormKeypress = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            this.validateRegisterForm()
        }
    }

    validateAccessCodeForm() {
        const accessCodeForm = this.accessCodeForm?.nativeElement
        if (
            !this.accessCodeFormGroup.valid ||
            !accessCodeForm.checkValidity()
        ) {
            this.logger.error('validation error')
        } else {
            this.validateAccessCode()
        }
        accessCodeForm.classList.add('was-validated')
    }

    validateRegisterForm() {
        const registerForm = this.registerForm?.nativeElement
        if (!this.registerFormGroup.valid || !registerForm.checkValidity()) {
            this.logger.error('validation error')
        } else {
            this.register()
        }
        registerForm.classList.add('was-validated')
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

    private validateAccessCode() {
        this.logger.info('validating access code')
        this.loading = true

        this.accessCode = this.accessCodeFormGroup.value.accessCode
        this.authSvc
            .validateAccessCode(this.accessCode)
            .pipe(
                switchMap((resp) => {
                    this.name = resp.name
                    this.email = resp.email
                    this.accessCodeValidated = true
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error('error while validating access code')
                    this.accessCodeFormGroup.patchValue({ accessCode: '' })
                    return throwError(() => err)
                }),
                finalize(() => {
                    this.loading = false
                })
            )
            .subscribe()
    }

    private register() {
        this.logger.info('registering')
        this.loading = true

        const username = this.registerFormGroup.value.username
        const password = this.registerFormGroup.value.password

        this.authSvc
            .register(this.accessCode, username, password)
            .pipe(
                switchMap((user) => {
                    this.userSvc.user = user
                    this.router.navigateByUrl('/home')
                    this.alertSvc.clearAlerts()
                    this.alertSvc.addSuccessAlert('Success registering')
                    return of(undefined)
                }),
                catchError((err: HttpErrorResponse) => {
                    this.logger.error('error while registering')
                    if (err.status === 409) {
                        this.alertSvc.clearAlerts()
                        this.alertSvc.addErrorAlert(
                            'An account with that username already exists',
                            ['Please choose another username or log in']
                        )
                        this.registerFormGroup.patchValue({
                            username: '',
                            confirmPassword: '',
                        })
                        return of(undefined)
                    }
                    this.alertSvc.addErrorAlert(
                        'Registration failed. Please try again'
                    )
                    this.registerFormGroup.patchValue({ confirmPassword: '' })
                    return throwError(() => err)
                }),
                finalize(() => {
                    this.loading = false
                })
            )
            .subscribe()
    }
}
