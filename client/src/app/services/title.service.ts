import { Injectable, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { RouterStateSnapshot, TitleStrategy } from '@angular/router'
import { env } from '@environments'
import { EnvNameEnum } from '@wealthwatch-shared'

@Injectable({ providedIn: 'root' })
export class TitleService extends TitleStrategy {
    private readonly title = inject(Title)

    override updateTitle(routerState: RouterStateSnapshot) {
        const prefix = this.buildTitle(routerState)
        const suffix =
            'WealthWatch' +
            (env.name !== EnvNameEnum.Prod ? ` (${env.name})` : '')
        if (!prefix) {
            this.title.setTitle(suffix)
            return
        }
        this.title.setTitle(`${prefix} | ${suffix}`)
    }
}
