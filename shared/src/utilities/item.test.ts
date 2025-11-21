import { isInCooldown, refreshCooldown } from '@utilities'
import { describe, expect, it } from 'vitest'

describe('itemInCooldown', () => {
    it('returns false if timestamp is null', () => {
        expect(isInCooldown(null)).toBe(false)
    })

    it('returns false if timestamp is beyond cooldown period', () => {
        const timestamp = Date.now() - refreshCooldown
        expect(isInCooldown(new Date(timestamp))).toBe(false)
    })

    it('returns true if timestamp is within cooldown period', () => {
        const timestamp = Date.now() - (refreshCooldown - 1000)
        expect(isInCooldown(new Date(timestamp))).toBe(true)
    })
})
