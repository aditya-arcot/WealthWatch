import { Component, OnInit } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { Router, RouterOutlet } from '@angular/router'
import { Chart, Tooltip } from 'chart.js'
import { env } from '../environments/env'
import { AlertComponent } from './components/alert/alert.component'
import { HeaderComponent } from './components/header/header.component'
import { CustomBarElement } from './models/chart.js'
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

        // vertically-centered tooltip for stacked bar graph
        Tooltip.positioners.center = (items) => {
            if (items.length) {
                const element = items[0].element as CustomBarElement
                if (isNaN(element.height)) return false
                const x = element.x
                const y =
                    element.base < element.y
                        ? element.y - element.height / 2
                        : element.y + element.height / 2
                return { x, y }
            }
            return false
        }

        // bootstrap 5 font family
        Chart.defaults.font.family = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
        Chart.defaults.color = 'black'
        Chart.defaults.font.size = 10
    }

    noHeaderPath(path: string) {
        return this.noHeaderPaths.includes(path)
    }
}
