import { pino } from 'pino'
import { vars } from './env.js'

export const logger = pino({
    level: vars.logLevel,
    transport: {
        targets: [
            {
                target: '@logtail/pino',
                level: vars.logLevel,
                options: {
                    sourceToken: vars.serverLogtailToken,
                },
            },
            {
                target: 'pino-pretty',
                level: vars.logLevel,
                options: {
                    colorize: true,
                },
            },
        ],
    },
})
