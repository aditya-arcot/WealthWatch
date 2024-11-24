import { Injectable } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { env } from '../../environments/env'

@Injectable({ providedIn: 'root' })
export class TitleService extends TitleStrategy {
    constructor(private readonly title: Title) {
        super()
    }

    override updateTitle(routerState: RouterStateSnapshot) {
        const title = this.buildTitle(routerState)
        if (env.name !== 'prod') {
            this.title.setTitle(`${title} | WealthWatch (${env.name})`)
        } else {
            this.title.setTitle(`${title} | WealthWatch`)
        }
    }
}
