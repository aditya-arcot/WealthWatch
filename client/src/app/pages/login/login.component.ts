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
import { catchError, finalize, throwError } from 'rxjs'
import { LoggerComponent } from '../../components/logger.component'
import { RouteEnum } from '../../enums/route'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { SecretsService } from '../../services/secrets.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent
    extends LoggerComponent
    implements OnInit, AfterViewInit
{
    private formBuilder = inject(FormBuilder)
    private userSvc = inject(UserService)
    private authSvc = inject(AuthService)
    private router = inject(Router)
    private alertSvc = inject(AlertService)
    private secretsSvc = inject(SecretsService)

    @ViewChild('loginForm') loginForm!: ElementRef<HTMLFormElement>
    loginFormGroup: FormGroup
    loading = false

    constructor() {
        super('LoginComponent')
        this.loginFormGroup = this.formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        })
    }

    ngOnInit(): void {
        if (this.userSvc.user) {
            void this.router.navigateByUrl(RouteEnum.Home)
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
                    this.alertSvc.addErrorAlert(this.logger, 'Failed to log in')
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
                void this.router.navigateByUrl(RouteEnum.Home)
                this.alertSvc.addSuccessAlert(this.logger, 'Success logging in')
            })
    }

    loginWithDemo() {
        this.login(true)
    }
}
