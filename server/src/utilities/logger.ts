import { formatDate } from 'date-fns'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { pino } from 'pino'
import { dev, vars } from './env.js'

interface PinoTarget {
    target: string
    level: string
    options: object
}
const targets: PinoTarget[] = [
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
]

if (dev) {
    const logDirectory = path.resolve(os.homedir(), 'Projects', 'Logs')
    const formattedDate = formatDate(new Date(), 'yyyy_MM_dd')
    const fileName = `wealthwatch_server-${formattedDate}.log`
    const logPath = path.join(logDirectory, fileName)

    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory)
    }

    targets.push({
        target: 'pino/file',
        level: 'trace',
        options: {
            destination: logPath,
        },
    })
}

export const logger = pino({
    level: vars.logLevel,
    transport: { targets },
})

export const _test = { targets }
