import { Component, Inject, Injector } from '@angular/core'
import { NGXLogger } from 'ngx-logger'
import {
    createLoggerWithContext,
    LoggerService,
    LogtailService,
} from '../services/logger.service'

@Component({
    template: '',
})
export abstract class LoggerComponent {
    protected logger: LoggerService

    constructor(injector: Injector, @Inject(String) context: string) {
        const ngxLogger = injector.get(NGXLogger)
        const logtail = injector.get(LogtailService)
        this.logger = createLoggerWithContext(ngxLogger, logtail, context)
    }
}
