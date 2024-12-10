import { CommonModule } from '@angular/common'
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
import { catchError, finalize, throwError } from 'rxjs'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, AfterViewInit {
    @ViewChild('loginForm') loginForm!: ElementRef<HTMLFormElement>
    loginFormGroup: FormGroup
    loading = false

    constructor(
        private formBuilder: FormBuilder,
        private logger: LoggerService,
        private userSvc: UserService,
        private authSvc: AuthService,
        private router: Router,
        private alertSvc: AlertService
    ) {
        this.loginFormGroup = this.formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
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
        const form = this.loginForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.loginFormGroup.valid || !form.checkValidity()) {
                this.logger.error('validation error')
                submitEvent.preventDefault()
                submitEvent.stopPropagation()
            } else {
                this.login()
            }
            form.classList.add('was-validated')
        })
    }

    login(demo = false) {
        this.logger.info('logging in')
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
                    this.alertSvc.addErrorAlert('Login failed')
                    if (err.status === 404) {
                        this.loginFormGroup.reset()
                        return throwError(() => err)
                    }
                    this.loginFormGroup.patchValue({ password: '' })
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe((user) => {
                this.userSvc.user = user
                this.router.navigateByUrl('/home')
                this.alertSvc.clearAlerts()
                this.alertSvc.addSuccessAlert('Success logging in')
            })
    }

    loginWithDemo() {
        this.login(true)
    }
}
