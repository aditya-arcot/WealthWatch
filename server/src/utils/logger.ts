import { pino } from 'pino'
import { env } from 'process'

const level = env['LOG_LEVEL'] || 'info'
const token = env['SERVER_LOGTAIL_TOKEN']
if (!token) {
    throw Error('missing logtail token')
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
