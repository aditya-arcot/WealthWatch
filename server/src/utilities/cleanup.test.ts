import * as db from '@database'
import { CLEANUP_EVENTS } from '@models'
import * as queues from '@queues'
import * as logger from '@utilities'
import * as redis from '@utilities'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./logger', () => ({
    logger: {
        fatal: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}))

vi.mock('../queues', () => ({
    closeWorkers: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./redis', () => ({
    stopRedis: vi.fn(),
}))

vi.mock('../database', () => ({
    stopPool: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
})

describe('configureCleanup', () => {
    it('attaches listeners for cleanup events', async () => {
        vi.spyOn(process, 'on')

        const { configureCleanup } = await import('./cleanup.js')
        configureCleanup()

        CLEANUP_EVENTS.forEach((event) => {
            // eslint-disable-next-line @typescript-eslint/unbound-method
            expect(process.on).toHaveBeenCalledWith(event, expect.any(Function))
        })
        expect(logger.logger.debug).toHaveBeenCalledOnce()
    })

    it('calls runCleanupAndExit on cleanup event', async () => {
        const onSpy = vi.spyOn(process, 'on')

        const { configureCleanup } = await import('./cleanup.js')
        configureCleanup()

        const onCall = onSpy.mock.calls.find(
            ([event]) => event === CLEANUP_EVENTS[0]
        )
        expect(onCall).toBeDefined()
        const onHandler = onCall?.[1]
        expect(onHandler).toBeDefined()

        await new Promise<void>((resolve) => {
            vi.spyOn(process, 'exit').mockImplementation(() => {
                resolve()
                return undefined as never
            })
            onHandler?.(new Error('test error'))
        })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledOnce()
    })
})

describe('runCleanupAndExit', () => {
    it('runs cleanup functions once and exits', async () => {
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

        const { _cleanupTest: _test } = await import('./cleanup.js')
        const error = new Error('test error')
        await _test.runCleanupAndExit(CLEANUP_EVENTS[0], error)
        await _test.runCleanupAndExit(CLEANUP_EVENTS[1], error)

        expect(logger.logger.fatal).toHaveBeenCalledTimes(2)
        expect(logger.logger.fatal).toHaveBeenNthCalledWith(
            1,
            error,
            CLEANUP_EVENTS[0]
        )
        expect(logger.logger.fatal).toHaveBeenNthCalledWith(
            2,
            error,
            CLEANUP_EVENTS[1]
        )
        expect(logger.logger.warn).toHaveBeenCalledExactlyOnceWith(
            'already exiting'
        )
        expect(queues.closeWorkers).toHaveBeenCalledOnce()
        expect(redis.stopRedis).toHaveBeenCalledOnce()
        expect(db.stopPool).toHaveBeenCalledOnce()
        expect(logger.logger.info).toHaveBeenCalledWith(
            expect.stringContaining('exiting - pid')
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledOnce()
    })

    it('handles error during cleanup', async () => {
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
        vi.spyOn(queues, 'closeWorkers').mockRejectedValue(
            new Error('test error')
        )

        const { _cleanupTest: _test } = await import('./cleanup.js')
        await _test.runCleanupAndExit(CLEANUP_EVENTS[2])

        expect(logger.logger.warn).not.toHaveBeenCalled()
        expect(logger.logger.fatal).toHaveBeenCalledTimes(2)
        expect(logger.logger.fatal).toHaveBeenNthCalledWith(
            2,
            expect.any(Error),
            'error during cleanup'
        )
        expect(logger.logger.info).toHaveBeenCalledWith(
            expect.stringContaining('exiting - pid')
        )
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(process.exit).toHaveBeenCalledOnce()
    })
})
