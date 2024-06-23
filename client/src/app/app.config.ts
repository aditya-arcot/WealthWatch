import { provideHttpClient } from '@angular/common/http'
import {
    APP_INITIALIZER,
    ApplicationConfig,
    importProvidersFrom,
    provideZoneChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger'
import { lastValueFrom } from 'rxjs'
import { env } from '../environments/env'
import { routes } from './app.routes'
import { StartupService } from './services/startup.service'

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(),
        importProvidersFrom(
            LoggerModule.forRoot({
                level:
                    env.name === 'prod'
                        ? NgxLoggerLevel.INFO
                        : NgxLoggerLevel.DEBUG,
            })
        ),
        {
            provide: APP_INITIALIZER,
            useFactory: (startupSvc: StartupService) => () =>
                lastValueFrom(startupSvc.startup()).then((success) => {
                    if (!success) {
                        // TODO reroute to error page
                    }
                }),
            deps: [StartupService],
            multi: true,
        },
    ],
}
