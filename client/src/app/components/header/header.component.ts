import { Component, OnInit } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { UserService } from '../../services/user.service'

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
    public userName: string | undefined

    constructor(private userSvc: UserService) {}

    ngOnInit(): void {
        const user = this.userSvc.getCurrentUser()
        this.userName = user?.firstName
    }
}
