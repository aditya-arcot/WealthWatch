import { CommonModule, JsonPipe } from '@angular/common'
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
import { AuthService } from '../../services/auth.service'
import { LoggerService } from '../../services/logger.service'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, JsonPipe, RouterLink],
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
        private router: Router
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
                    this.logger.error('login required')
                    return throwError(() => err)
                })
            )
            .subscribe(() => {
                this.logger.info('login not required')
                this.router.navigateByUrl('/home')
            })
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

    login() {
        this.logger.info('logging in')
        this.loading = true
        const username = this.loginFormGroup.value.username
        const password = this.loginFormGroup.value.password
        this.authSvc
            .login(username, password)
            .pipe(
                catchError((err) => {
                    if (err.status === 404) {
                        this.loginFormGroup.reset()
                        return throwError(() => Error('user not found'))
                    }
                    this.loginFormGroup.setValue({ username, password: '' })
                    return throwError(() => Error('incorrect password'))
                }),
                finalize(() => (this.loading = false))
            )
            .subscribe(() => {
                this.logger.info('login success')
                this.router.navigateByUrl('/home')
            })
    }
}
