import { Component, OnInit } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { Router, RouterOutlet } from '@angular/router'
import { env } from '../environments/env'
import { AlertComponent } from './components/alert/alert.component'
import { HeaderComponent } from './components/header/header.component'
import { AuthService } from './services/auth.service'

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, AlertComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
    readonly noHeaderPaths = [
        '/startup-error',
        '/login',
        '/logout',
        '/register',
    ]

    constructor(
        public authSvc: AuthService,
        public router: Router,
        public titleSvc: Title
    ) {}

    ngOnInit(): void {
        if (env.name !== 'prod') {
            this.titleSvc.setTitle(`WealthWatch (${env.name})`)
        }
    }

    noHeaderPath(path: string) {
        return this.noHeaderPaths.includes(path)
    }
}
