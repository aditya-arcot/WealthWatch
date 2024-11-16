import { Injectable } from '@angular/core'
import { Logtail } from '@logtail/browser'
import { NGXLogger } from 'ngx-logger'

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
    private logtail: Logtail | undefined

    constructor(private logger: NGXLogger) {}

    configureLogtail(token: string): void {
        this.logtail = new Logtail(token)
    }

    debug(message: unknown, ...args: unknown[]): void {
        this.logger.debug(message, ...args)
        this.logtail?.debug(this.formatMessage(message), { ...args })
        this.logtail?.flush()
    }

    info(message: unknown, ...args: unknown[]): void {
        this.logger.info(message, ...args)
        this.logtail?.info(this.formatMessage(message), { ...args })
        this.logtail?.flush()
    }

    warn(message: unknown, ...args: unknown[]): void {
        this.logger.warn(message, ...args)
        this.logtail?.warn(this.formatMessage(message), { ...args })
        this.logtail?.flush()
    }

    error(message: unknown, ...args: unknown[]): void {
        this.logger.error(message, ...args)
        this.logtail?.error(this.formatMessage(message), { ...args })
        this.logtail?.flush()
    }

    formatMessage = (message: unknown): string => {
        if (typeof message === 'object') {
            return JSON.stringify(message)
        }
        return String(message)
    }
}
