import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { StartupService } from '../../services/startup.service'

@Component({
    selector: 'app-startup-error',
    standalone: true,
    templateUrl: './startup-error.component.html',
})
export class StartupErrorComponent implements OnInit {
    constructor(
        private startupSvc: StartupService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.startupSvc.success) {
            this.router.navigateByUrl('/home')
            return
        }
    }
}
