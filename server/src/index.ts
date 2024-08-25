import { pid } from 'process'
import { startExpressApps } from './app.js'
import { createPool } from './database/index.js'
import { createPlaidClient } from './plaid/index.js'
import { initializeQueues, initializeWorkers } from './queues/index.js'
import { configureCleanup } from './utils/cleanup.js'
import { vars } from './utils/env.js'
import { logger } from './utils/logger.js'
import { createRedis } from './utils/redis.js'

logger.info(`started - pid ${pid}`)
logger.debug(vars, 'env vars')
configureCleanup()
createPlaidClient()
await createPool()
createRedis()
initializeQueues()
initializeWorkers()
startExpressApps()
