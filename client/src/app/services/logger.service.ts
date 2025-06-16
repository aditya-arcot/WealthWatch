import { inject, Injectable } from '@angular/core'
import { Logtail } from '@logtail/browser'
import { NGXLogger } from 'ngx-logger'

@Injectable({
    providedIn: 'root',
})
export class LogtailService {
    logtail: Logtail | undefined

    configure(token: string): void {
        this.logtail = new Logtail(token)
    }
}

interface Log {
    message: string
    data?: unknown
    context?: string
}

export class LoggerService {
    private logger = inject(NGXLogger)
    private logtailSvc = inject(LogtailService)

    constructor(private context: string) {}

    debug(message: string, data?: object): void {
        this.logger.debug(this.createLogWithData(message, data))
        void this.logtailSvc.logtail
            ?.debug(message, { data })
            .then(() => this.logtailSvc.logtail?.flush())
    }

    info(message: string, data?: object): void {
        this.logger.info(this.createLogWithData(message, data))
        void this.logtailSvc.logtail
            ?.info(message, { data })
            .then(() => this.logtailSvc.logtail?.flush())
    }

    warn(message: string, data?: object): void {
        this.logger.warn(this.createLogWithData(message, data))
        void this.logtailSvc.logtail
            ?.warn(message, { data })
            .then(() => this.logtailSvc.logtail?.flush())
    }

    private createLogWithData(message: string, data?: unknown) {
        const log: Log = {
            context: this.context,
            message,
        }
        if (data) log.data = data
        return log
    }

    error(message: string, error?: object): void {
        const log = {
            context: this.context,
            message,
            error,
        }
        this.logger.error(log)
        void this.logtailSvc.logtail
            ?.error(message, { error })
            .then(() => this.logtailSvc.logtail?.flush())
    }
}

export function createLoggerWithContext(context: string): LoggerService {
    return new LoggerService(context)
}
