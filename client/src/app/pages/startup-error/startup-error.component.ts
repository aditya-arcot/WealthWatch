import { Component, OnInit, inject } from '@angular/core'
import { Router } from '@angular/router'
import { RouteEnum } from 'src/app/enums/route'
import { StartupService } from '../../services/startup.service'

@Component({
    selector: 'app-startup-error',
    templateUrl: './startup-error.component.html',
})
export class StartupErrorComponent implements OnInit {
    private startupSvc = inject(StartupService)
    private router = inject(Router)

    ngOnInit(): void {
        if (this.startupSvc.success) {
            void this.router.navigateByUrl(RouteEnum.Home)
            return
        }
    }
}
