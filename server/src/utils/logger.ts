import { pino } from 'pino'
import { env, exit } from 'process'

const level = env['LOG_LEVEL'] || 'info'
const token = env['LOGTAIL_TOKEN']
if (!token) {
    console.error('logtail token missing')
    exit(1)
}
export const logger = pino({
    level: level,
    transport: {
        targets: [
            {
                target: '@logtail/pino',
                level: level,
                options: {
                    sourceToken: token,
                },
            },
            {
                target: 'pino-pretty',
                level: level,
                options: {
                    colorize: true,
                },
            },
        ],
    },
})
