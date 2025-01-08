import { CommonModule } from '@angular/common'
import {
    AfterViewInit,
    Component,
    ElementRef,
    Injector,
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
import { catchError, finalize, throwError } from 'rxjs'
import { LoggerComponent } from '../../components/logger.component'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { SecretsService } from '../../services/secrets.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent
    extends LoggerComponent
    implements OnInit, AfterViewInit
{
    @ViewChild('loginForm') loginForm!: ElementRef<HTMLFormElement>
    loginFormGroup: FormGroup
    loading = false

    constructor(
        private formBuilder: FormBuilder,
        private userSvc: UserService,
        private authSvc: AuthService,
        private router: Router,
        private alertSvc: AlertService,
        private secretsSvc: SecretsService,
        injector: Injector
    ) {
        super(injector, 'LoginComponent')
        this.loginFormGroup = this.formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        })
    }

    ngOnInit(): void {
        if (this.userSvc.user) {
            this.router.navigateByUrl('/home')
            this.alertSvc.addSuccessAlert(this.logger, 'Already logged in')
        }
    }

    ngAfterViewInit(): void {
        const form = this.loginForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.loginFormGroup.valid || !form.checkValidity()) {
                this.logger.info('validation failed')
                submitEvent.preventDefault()
                submitEvent.stopPropagation()
            } else {
                this.login()
            }
            form.classList.add('was-validated')
        })
    }

    login(demo = false) {
        this.logger.info('logging in', { demo })
        this.loading = true

        const loginObservable = demo
            ? this.authSvc.loginWithDemo()
            : this.authSvc.login(
                  this.loginFormGroup.value.username,
                  this.loginFormGroup.value.password
              )

        loginObservable
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert(
                        this.logger,
                        'Failed to log in. Please try again'
                    )
                    if (err.status === 404) {
                        this.loginFormGroup.reset()
                        return throwError(() => err)
                    }
                    this.loginFormGroup.patchValue({ password: '' })
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.logger.info('getting secrets')
                this.secretsSvc.getSecrets().subscribe()
                this.router.navigateByUrl('/home')
                this.alertSvc.addSuccessAlert(this.logger, 'Success logging in')
            })
    }

    loginWithDemo() {
        this.login(true)
    }
}
