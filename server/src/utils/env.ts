import { env } from 'process'
import { HttpError } from '../models/httpError.js'

const getEnvVar = (key: string): string => {
    const val = env[key]
    if (val === undefined) throw new HttpError(`missing env var ${key}`)
    return val
}

export const vars = {
    clientLogtailToken: getEnvVar('CLIENT_LOGTAIL_TOKEN'),
    serverLogtailToken: getEnvVar('SERVER_LOGTAIL_TOKEN'),
    redisHost: getEnvVar('REDIS_HOST'),
    dbHost: getEnvVar('DB_HOST'),
    dbName: getEnvVar('DB_NAME'),
    dbUser: getEnvVar('DB_USER'),
    dbPassword: getEnvVar('DB_PASSWORD'),
    csrfSecret: getEnvVar('CSRF_SECRET'),
    sessionSecret: getEnvVar('SESSION_SECRET'),
    plaidClientId: getEnvVar('PLAID_CLIENT_ID'),
    plaidSecret: getEnvVar('PLAID_SECRET'),
    plaidWebhookUrl: getEnvVar('PLAID_WEBHOOK_URL'),
    logLevel: getEnvVar('LOG_LEVEL'),
    nodeEnv: getEnvVar('NODE_ENV'),
    plaidEnv: getEnvVar('PLAID_ENV'),
}
export const stage = vars.nodeEnv === 'stage'
export const production = vars.nodeEnv === 'prod' || vars.nodeEnv === 'stage'
