import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
    ApplicationConfig,
    importProvidersFrom,
    inject,
    provideAppInitializer,
    provideZoneChangeDetection,
} from '@angular/core'
import { provideRouter, TitleStrategy } from '@angular/router'
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger'
import { EnvNameEnum } from 'wealthwatch-shared'
import { env } from '../environments/env'
import { routes } from './app.routes'
import { authInterceptor } from './interceptors/auth-interceptor'
import { csrfInterceptor } from './interceptors/csrf-interceptor'
import { errorInterceptor } from './interceptors/error-interceptor'
import { StartupService } from './services/startup.service'
import { TitleService } from './services/title.service'

const provideLogger = () => {
    return importProvidersFrom(
        LoggerModule.forRoot({
            level:
                env.name === EnvNameEnum.Prod
                    ? NgxLoggerLevel.WARN
                    : NgxLoggerLevel.DEBUG,
        })
    )
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        { provide: TitleStrategy, useClass: TitleService },
        provideLogger(),
        provideHttpClient(
            withInterceptors([
                authInterceptor,
                csrfInterceptor,
                errorInterceptor,
            ])
        ),
        provideAppInitializer(() => inject(StartupService).startup()),
        provideCharts(withDefaultRegisterables()),
    ],
}
