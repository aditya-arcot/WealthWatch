import { createPool } from '@database/index.js'
import { createPlaidClient } from '@plaid/index.js'
import { initializeQueues, initializeWorkers } from '@queues/index.js'
import { configureCleanup } from '@utilities/cleanup.js'
import { vars } from '@utilities/env.js'
import { logger } from '@utilities/logger.js'
import { createRedis } from '@utilities/redis.js'
import { pid } from 'process'
// eslint-disable-next-line no-restricted-imports
import { startExpressApps } from './app.js'

logger.info(`started - pid ${pid}`)
logger.debug(vars, 'env vars')
configureCleanup()
createPlaidClient()
await createPool()
await createRedis()
initializeQueues()
initializeWorkers()
startExpressApps()
