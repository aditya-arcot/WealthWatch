import { Component } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
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
export class AppComponent {
    readonly noHeaderPaths = [
        '/startup-error',
        '/login',
        '/logout',
        '/register',
    ]

    constructor(
        public authSvc: AuthService,
        public router: Router
    ) {}

    noHeaderPath(path: string) {
        return this.noHeaderPaths.includes(path)
    }
}
