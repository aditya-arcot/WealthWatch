import { Injectable } from '@angular/core'
import { Logtail } from '@logtail/browser'
import { NGXLogger } from 'ngx-logger'
import { SecretsService } from './secrets.service'

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
    private logtail: Logtail | undefined

    constructor(
        private logger: NGXLogger,
        secretsSvc: SecretsService
    ) {
        const token = secretsSvc.secrets?.logtailToken
        if (token) this.logtail = new Logtail(token)
    }

    debug(message: string, ...args: unknown[]): void {
        this.logger.debug(message, ...args)
        this.logtail?.debug(message, { ...args })
        this.logtail?.flush()
    }

    info(message: string, ...args: unknown[]): void {
        this.logger.info(message, ...args)
        this.logtail?.info(message, { ...args })
        this.logtail?.flush()
    }

    warn(message: string, ...args: unknown[]): void {
        this.logger.warn(message, ...args)
        this.logtail?.warn(message, { ...args })
        this.logtail?.flush()
    }

    error(message: string, ...args: unknown[]): void {
        this.logger.error(message, ...args)
        this.logtail?.error(message, { ...args })
        this.logtail?.flush()
    }
}
