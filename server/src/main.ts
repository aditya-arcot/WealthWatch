import { createPool } from '@database'
import { createPlaidClient } from '@plaid'
import { initializeQueues, initializeWorkers } from '@queues'
import { configureCleanup, createRedis, logger, vars } from '@utilities'
import { pid } from 'process'
// eslint-disable-next-line no-restricted-imports
import { startExpressApps } from './app.js'

logger.info(`started - pid ${String(pid)}`)
logger.debug(vars, 'env vars')
configureCleanup()
createPlaidClient()
await createPool()
await createRedis()
initializeQueues()
initializeWorkers()
startExpressApps()
