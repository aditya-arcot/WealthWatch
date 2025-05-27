import { pid } from 'process'
import { startExpressApps } from './app.js'
import { createPool } from './database/index.js'
import { createPlaidClient } from './plaid/index.js'
import { initializeQueues, initializeWorkers } from './queues/index.js'
import { configureCleanup } from './utilities/cleanup.js'
import { vars } from './utilities/env.js'
import { logger } from './utilities/logger.js'
import { createRedis } from './utilities/redis.js'

logger.info(`started - pid ${pid}`)
logger.debug(vars, 'env vars')
configureCleanup()
createPlaidClient()
await createPool()
await createRedis()
initializeQueues()
initializeWorkers()
startExpressApps()
