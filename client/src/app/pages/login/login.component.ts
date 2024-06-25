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
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { catchError, finalize, throwError } from 'rxjs'
import { User } from '../../models/user'
import { AlertService } from '../../services/alert.service'
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-login',
    standalone: true,
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
        this.userSvc
            .currentUser()
            .pipe(
                catchError((err: HttpErrorResponse) => {
                    this.logger.error('error while getting current user')
                    return throwError(() => err)
                })
            )
            .subscribe((user?: User) => {
                if (!user) {
                    this.logger.info('not logged in')
                    return
                }
                this.router.navigateByUrl('/home')
                this.alertSvc.clearAlerts()
                this.alertSvc.addSuccessAlert('Already logged in')
            })
    }

    ngAfterViewInit(): void {
        const form = this.loginForm?.nativeElement
        form.addEventListener('submit', (submitEvent: SubmitEvent) => {
            if (!this.loginFormGroup.valid || !form.checkValidity()) {
                this.alertSvc.addErrorAlert('Fix inputs and try again')
                submitEvent.preventDefault()
                submitEvent.stopPropagation()
            } else {
                this.login()
            }
            form.classList.add('was-validated')
        })
    }

    login() {
        this.logger.info('logging in')
        this.loading = true
        const username = this.loginFormGroup.value.username
        const password = this.loginFormGroup.value.password
        this.authSvc
            .login(username, password)
            .pipe(
                catchError((err) => {
                    this.alertSvc.addErrorAlert('Login failed')
                    if (err.status === 404) {
                        this.loginFormGroup.reset()
                        return throwError(() => err)
                    }
                    this.loginFormGroup.setValue({ username, password: '' })
                    return throwError(() => err)
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.router.navigateByUrl('/home')
                this.alertSvc.clearAlerts()
                this.alertSvc.addSuccessAlert('Success signing in')
            })
    }
}
