import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './home.component.html',
})
export class HomeComponent {
    constructor(private userSvc: UserService) {}

    get firstName() {
        return this.userSvc.user?.firstName
    }

    get inDemo() {
        return this.userSvc.inDemo()
    }
}
