import { Component, OnInit, inject } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { AlertComponent } from '@components/alert/alert.component'
import { HeaderComponent } from '@components/header/header.component'
import { RouteEnum } from '@enums/route'
import { CustomBarElement } from '@models/chart.js'
import { Chart, Tooltip } from 'chart.js'
import autocolors from 'chartjs-plugin-autocolors'

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, HeaderComponent, AlertComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
    router = inject(Router)

    readonly noHeaderPaths: string[] = [
        RouteEnum.StartupError,
        RouteEnum.Login,
        RouteEnum.Logout,
        RouteEnum.AccessRequest,
        RouteEnum.Register,
    ]

    ngOnInit(): void {
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

        Chart.register(autocolors)

        // bootstrap 5 font family
        Chart.defaults.font.family = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
        Chart.defaults.color = 'black'
        Chart.defaults.font.size = 10

        Chart.defaults.devicePixelRatio = 3
    }

    noHeaderPath(path: string) {
        const firstSegment = path.split('/')[1]
        if (!firstSegment) return true
        return this.noHeaderPaths.includes(firstSegment)
    }
}
