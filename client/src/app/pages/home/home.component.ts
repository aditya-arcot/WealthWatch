import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserService } from '@services/user.service'

@Component({
    selector: 'app-home',
    imports: [RouterLink],
    templateUrl: './home.component.html',
})
export class HomeComponent {
    private userSvc = inject(UserService)

    get firstName() {
        return this.userSvc.user?.firstName
    }

    get inDemo() {
        return this.userSvc.inDemo()
    }
}
