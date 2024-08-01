import {
    HTTP_INTERCEPTORS,
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http'
import {
    APP_INITIALIZER,
    ApplicationConfig,
    importProvidersFrom,
    provideZoneChangeDetection,
} from '@angular/core'
import { Title } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger'
import { env } from '../environments/env'
import { routes } from './app.routes'
import { AuthInterceptor } from './interceptors/auth-interceptor'
import { CSRFInterceptor } from './interceptors/csrf-interceptor'
import { ErrorInterceptor } from './interceptors/error-interceptor'
import { StartupService } from './services/startup.service'

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
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
                startupSvc.startup(),
            deps: [StartupService],
            multi: true,
        },
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
    ],
}
