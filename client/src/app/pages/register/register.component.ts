import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { catchError, finalize, of, switchMap, throwError } from 'rxjs'
import { RouteEnum } from 'src/app/enums/route'
import { LoggerComponent } from '../../components/logger.component'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { SecretsService } from '../../services/secrets.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
})
export class RegisterComponent extends LoggerComponent implements OnInit {
    private formBuilder = inject(FormBuilder)
    private userSvc = inject(UserService)
    private router = inject(Router)
    private authSvc = inject(AuthService)
    private alertSvc = inject(AlertService)
    private secretsSvc = inject(SecretsService)

    @ViewChild('accessCodeForm') accessCodeForm!: ElementRef<HTMLFormElement>
    @ViewChild('registerForm') registerForm!: ElementRef<HTMLFormElement>

    loading = false
    accessCodeFormGroup: FormGroup
    registerFormGroup: FormGroup
    accessCodeValidated = false
    accessCode = ''
    name = ''
    email = ''

    constructor() {
        super('RegisterComponent')
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
            void this.router.navigateByUrl(RouteEnum.Home)
            this.alertSvc.addSuccessAlert(this.logger, 'Already logged in')
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
            this.logger.info('validation failed')
        } else {
            this.validateAccessCode()
        }
        accessCodeForm.classList.add('was-validated')
    }

    validateRegisterForm() {
        const registerForm = this.registerForm?.nativeElement
        if (!this.registerFormGroup.valid || !registerForm.checkValidity()) {
            this.logger.info('validation failed')
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
                    this.alertSvc.addSuccessAlert(
                        this.logger,
                        'Success validating access code',
                        'Please continue with registration'
                    )
                    this.name = resp.name
                    this.email = resp.email
                    this.accessCodeValidated = true
                    return of(undefined)
                }),
                catchError((err) => {
                    if (err.status === 400) {
                        this.alertSvc.addErrorAlert(
                            this.logger,
                            'Invalid access code'
                        )
                        this.accessCodeFormGroup.patchValue({ accessCode: '' })
                        return of(undefined)
                    }
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to validate access code'
                    )
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
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
                switchMap(() => {
                    void this.router.navigateByUrl(RouteEnum.Home)
                    this.alertSvc.addSuccessAlert(
                        this.logger,
                        'Success registering'
                    )
                    return of(undefined)
                }),
                catchError((err) => {
                    if (err.status === 409) {
                        this.alertSvc.addErrorAlert(
                            this.logger,
                            'That username is not available',
                            'Please choose another username or log in'
                        )
                        this.registerFormGroup.patchValue({
                            username: '',
                            confirmPassword: '',
                        })
                        return of(undefined)
                    }
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Registration failed'
                    )
                    this.registerFormGroup.patchValue({ confirmPassword: '' })
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.logger.info('getting secrets')
                this.secretsSvc.getSecrets().subscribe()
            })
    }
}
