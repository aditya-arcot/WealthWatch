import { Injectable, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { env } from '@environments'
import { EnvNameEnum } from '@wealthwatch-shared'

@Injectable({ providedIn: 'root' })
export class TitleService extends TitleStrategy {
    private readonly title = inject(Title)

    override updateTitle(routerState: RouterStateSnapshot) {
        const title = this.buildTitle(routerState)
        if (env.name !== EnvNameEnum.Prod) {
            this.title.setTitle(`${title} | WealthWatch (${env.name})`)
        } else {
            this.title.setTitle(`${title} | WealthWatch`)
        }
    }
}
