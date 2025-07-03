import { describe, expect, it } from 'vitest'
import { EnvNameEnum } from '../wealthwatch-shared.js'
import { capitalizeFirstLetter, toTitleCase } from './string.js'

describe('capitalizeFirstLetter', () => {
    it('capitalizes first letter of string', () => {
        expect(capitalizeFirstLetter('')).toBe('')
        expect(capitalizeFirstLetter('hello world')).toBe('Hello world')
    })
})

describe('toTitleCase', () => {
    it('converts string to title case', () => {
        expect(toTitleCase('')).toBe('')
        expect(toTitleCase('hello world')).toBe('Hello World')
    })
})

describe('createCookieName', () => {
    const type = 'test'

    const expectCookieName = async (nodeEnv: string, type: string) => {
        process.env['NODE_ENV'] = nodeEnv
        const { prod, vars } = await import('./env.js')
        const { createCookieName } = await import('./string.js')
        const cookieName = prod
            ? `wealthwatch-${type}`
            : `wealthwatch-${vars.nodeEnv}-${type}`
        expect(createCookieName(type)).toBe(cookieName)
    }

    it('configures cookie name for dev', async () => {
        await expectCookieName(EnvNameEnum.Dev, type)
    })

    it('configures cookie name for test', async () => {
        await expectCookieName(EnvNameEnum.Test, type)
    })

    it('configures cookie name for stage', async () => {
        await expectCookieName(EnvNameEnum.Stage, type)
    })

    it('configures cookie name for prod', async () => {
        await expectCookieName(EnvNameEnum.Prod, type)
    })
})
