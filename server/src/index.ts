import { pid } from 'process'
import { createPool } from './database/index.js'
import { startApps } from './express/index.js'
import { initializeQueues, initializeWorkers } from './queues/index.js'
import { configureCleanup } from './utils/cleanup.js'
import { logger } from './utils/logger.js'
import { createRedis } from './utils/redis.js'

logger.info(`started - pid ${pid}`)

configureCleanup()
await createPool()
createRedis()
initializeQueues()
initializeWorkers()
startApps()
