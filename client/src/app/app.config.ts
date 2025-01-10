import {
    HTTP_INTERCEPTORS,
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http'
import {
    ApplicationConfig,
    importProvidersFrom,
    inject,
    provideAppInitializer,
    provideZoneChangeDetection,
} from '@angular/core'
import { Title } from '@angular/platform-browser'
import { provideRouter, TitleStrategy } from '@angular/router'
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger'
import { env } from '../environments/env'
import { routes } from './app.routes'
import { AuthInterceptor } from './interceptors/auth-interceptor'
import { CSRFInterceptor } from './interceptors/csrf-interceptor'
import { ErrorInterceptor } from './interceptors/error-interceptor'
import { StartupService } from './services/startup.service'
import { TitleService } from './services/title.service'

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideAppInitializer(() => inject(StartupService).startup()),
        { provide: TitleStrategy, useClass: TitleService },
        importProvidersFrom(
            LoggerModule.forRoot({
                level:
                    env.name === 'prod'
                        ? NgxLoggerLevel.WARN
                        : NgxLoggerLevel.DEBUG,
            })
        ),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CSRFInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true,
        },
        Title,
        provideCharts(withDefaultRegisterables()),
    ],
}
