import { Inject, Injectable } from '@angular/core'
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

@Injectable()
export class LoggerService {
    constructor(
        private logger: NGXLogger,
        private logtailSvc: LogtailService,
        @Inject(String) private context: string
    ) {}

    debug(message: string, data?: object): void {
        this.logger.debug(this.createLogWithData(message, data))
        this.logtailSvc.logtail?.debug(message, { data })
        this.logtailSvc.logtail?.flush()
    }

    info(message: string, data?: object): void {
        this.logger.info(this.createLogWithData(message, data))
        this.logtailSvc.logtail?.info(message, { data })
        this.logtailSvc.logtail?.flush()
    }

    warn(message: string, data?: object): void {
        this.logger.warn(this.createLogWithData(message, data))
        this.logtailSvc.logtail?.warn(message, { data })
        this.logtailSvc.logtail?.flush()
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
        this.logtailSvc.logtail?.error(message, { error })
        this.logtailSvc.logtail?.flush()
    }
}

export function createLoggerWithContext(
    logger: NGXLogger,
    logtail: LogtailService,
    context: string
): LoggerService {
    return new LoggerService(logger, logtail, context)
}
