import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { RouteEnum } from 'src/app/enums/route'
import { StartupService } from '../../services/startup.service'

@Component({
    selector: 'app-startup-error',
    templateUrl: './startup-error.component.html',
})
export class StartupErrorComponent implements OnInit {
    constructor(
        private startupSvc: StartupService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.startupSvc.success) {
            void this.router.navigateByUrl(RouteEnum.Home)
            return
        }
    }
}
